var CMDBHealthEvaluator = Class.create();
CMDBHealthEvaluator.prototype = {
    initialize: function() {
        // CONFIG
        this.STALE_THRESHOLD_DAYS     = 30;
        this.INCIDENT_LOOKBACK_DAYS   = 365;
        this.DUPLICATE_DETAIL_LIMIT   = 3;
        this.DUPLICATE_MIN_CONFIDENCE = 30;
        this.OP_STATUS_ACTIVE         = '1';
        this.MIN_PEER_SAMPLE          = 5;
        this.HIGH_CONFIDENCE_PCT      = 70;
        this.LOW_CONFIDENCE_PCT       = 30;
        this.MAX_PEER_VALUES          = 5;
        this.PEER_QUERY_LIMIT         = 100;
        this.SCOPE_PEERS_BY_ENV       = true;
        this.MAX_HIERARCHY_DEPTH      = 6;
        this.DUPLICATE_IDENTIFIERS    = ['serial_number', 'fqdn', 'ip_address'];
        this.IDENTIFIER_WEIGHTS       = { serial_number: 50, fqdn: 30, ip_address: 20 };
        this.REGULATORY_KEYWORDS      = ['pci', 'sox', 'hipaa', 'gdpr', 'iso 27001', 'nist'];
        this.W_CORRECTNESS            = 0.40;
        this.W_COMPLETENESS           = 0.30;
        this.W_COMPLIANCE             = 0.30;

        // GOVERNANCE from System Properties
        this.governance = {
            restricted_fields  : gs.getProperty('cmdb_health.governance.restricted_fields',
                                   'owned_by,business_criticality').split(','),
            safe_autofix_fields: gs.getProperty('cmdb_health.governance.safe_autofix_fields',
                                   'operational_status').split(','),
            allow_retirement   : gs.getProperty('cmdb_health.governance.allow_retirement', 'true') === 'true',
            allow_merge        : gs.getProperty('cmdb_health.governance.allow_merge', 'true') === 'true'
        };

        // Normalisation rules for OS/CPU/cloud peer values
        this.NORM_RULES = [
            { p: /red\s*hat|rhel/i,          n: 'Red Hat Enterprise Linux' },
            { p: /centos/i,                  n: 'CentOS'                   },
            { p: /ubuntu/i,                  n: 'Ubuntu'                   },
            { p: /debian/i,                  n: 'Debian'                   },
            { p: /suse|sles/i,               n: 'SUSE Linux'               },
            { p: /oracle\s*linux/i,          n: 'Oracle Linux'             },
            { p: /windows\s*server\s*2022/i, n: 'Windows Server 2022'      },
            { p: /windows\s*server\s*2019/i, n: 'Windows Server 2019'      },
            { p: /windows\s*server\s*2016/i, n: 'Windows Server 2016'      },
            { p: /windows\s*server\s*2012/i, n: 'Windows Server 2012'      },
            { p: /windows/i,                 n: 'Windows'                  },
            { p: /intel/i,                   n: 'Intel'                    },
            { p: /\bamd\b/i,                 n: 'AMD'                      },
            { p: /vmware|esxi/i,             n: 'VMware'                   },
            { p: /hyper\-?v/i,               n: 'Hyper-V'                  },
            { p: /\bkvm\b/i,                 n: 'KVM'                      },
            { p: /\bxen\b/i,                 n: 'Xen'                      },
            { p: /amazon|aws/i,              n: 'AWS'                      },
            { p: /azure|microsoft cloud/i,   n: 'Azure'                    },
            { p: /google cloud|gcp/i,        n: 'GCP'                      }
        ];

        // Compliance operator maps
        this.OP_LABEL_REVERSE = {
            'greater than'             : 'gt',
            'less than'                : 'lt',
            'equals'                   : 'eq',
            'is'                       : 'eq',
            'not equal'                : 'neq',
            'is not'                   : 'neq',
            'greater than or equal'    : 'gte',
            'greater than or equal to' : 'gte',
            'less than or equal'       : 'lte',
            'less than or equal to'    : 'lte',
            'contains'                 : 'contains',
            'does not contain'         : 'not_contains',
            'starts with'              : 'starts_with',
            'ends with'                : 'ends_with',
            'is empty'                 : 'is_empty',
            'is not empty'             : 'is_not_empty'
        };

        this.COND_OP_SYMBOLS = [
            { sym: '>=',          code: 'gte'          },
            { sym: '<=',          code: 'lte'          },
            { sym: '!=',          code: 'neq'          },
            { sym: '>',           code: 'gt'           },
            { sym: '<',           code: 'lt'           },
            { sym: '=',           code: 'eq'           },
            { sym: 'ISNOTEMPTY',  code: 'is_not_empty' },
            { sym: 'ISEMPTY',     code: 'is_empty'     },
            { sym: 'STARTSWITH',  code: 'starts_with'  },
            { sym: 'ENDSWITH',    code: 'ends_with'    },
            { sym: 'NOTCONTAINS', code: 'not_contains' },
            { sym: 'CONTAINS',    code: 'contains'     }
        ];
    },

    // ─── PUBLIC ENTRY POINT ───────────────────────────────────────────
    evaluate: function(ciSysId) {
        gs.info('[CMDBHealthEvaluator] Starting evaluation for CI: ' + ciSysId);

        // Load CI
        var ciBase = new GlideRecord('cmdb_ci');
        if (!ciBase.get(ciSysId)) {
            gs.error('[CMDBHealthEvaluator] CI not found: ' + ciSysId);
            return null;
        }
        var ciClass = ciBase.getValue('sys_class_name');
        var ci = new GlideRecord(ciClass);
        if (!ci.get(ciSysId)) {
            gs.error('[CMDBHealthEvaluator] Could not load from class table: ' + ciClass);
            return null;
        }

        this.ci        = ci;
        this.ciSysId   = ciSysId;
        this.ciClass   = ciClass;
        this.ciEnvironment = ci.isValidField('environment') ? (ci.getValue('environment') || null) : null;
        this.ciOpStatus    = ci.getValue('operational_status');
        this._dupCache     = {};
        this.fallbackChain = this._getClassFallbackChain(ciClass);

        gs.info('[CMDBHealthEvaluator] CI loaded: ' + ci.getDisplayValue('name') + ' (' + ciClass + ') — starting Phase 1A: Completeness');

        // Run sections in order — completeness first (its score feeds correctness)
        var completenessData  = this._runCompleteness();
        gs.info('[CMDBHealthEvaluator] Phase 1A Completeness done — score: ' + completenessData.score + ', missing fields: ' + completenessData.missing_count + '/' + completenessData.recommended_count + ' — starting Phase 1B: Correctness');

        var correctnessData   = this._runCorrectness(completenessData.score);
        gs.info('[CMDBHealthEvaluator] Phase 1B Correctness done — quality score: ' + correctnessData.quality_score.total + ', stale: ' + correctnessData.is_stale + ', orphan: ' + correctnessData.is_orphan + ' — starting Phase 1C: Compliance');

        var complianceData    = this._runCompliance();
        gs.info('[CMDBHealthEvaluator] Phase 1C Compliance done — score: ' + complianceData.score + ', violations: ' + complianceData.violations_count);

        // Overall score
        var rawOverall = Math.round(
            (correctnessData.quality_score.total * this.W_CORRECTNESS) +
            (completenessData.score              * this.W_COMPLETENESS) +
            (complianceData.score                * this.W_COMPLIANCE)
        );
        var overallScore = complianceData.has_regulatory
            ? Math.min(rawOverall, 40) : rawOverall;

        var healthStatus = overallScore >= 80 ? 'healthy'
                         : overallScore >= 60 ? 'minor'
                         : overallScore >= 40 ? 'moderate'
                         :                      'critical';

        var mergedPayload = {
            ci: {
                name       : ci.getDisplayValue('name'),
                sys_id     : ciSysId,
                ci_class   : ciClass,
                environment: this.ciEnvironment,
                op_status  : ci.getDisplayValue('operational_status')
            },
            scores: {
                overall           : overallScore,
                correctness       : correctnessData.quality_score.total,
                completeness      : completenessData.score,
                compliance        : complianceData.score,
                health_status     : healthStatus,
                quality_components: correctnessData.quality_score.components
            },
            correctness : correctnessData,
            completeness: completenessData,
            compliance  : complianceData
        };

        gs.info('[CMDBHealthEvaluator] Evaluation COMPLETE for CI: ' + ciSysId + ' — overall: ' + overallScore + ', status: ' + healthStatus + ' (correctness: ' + correctnessData.quality_score.total + ', completeness: ' + completenessData.score + ', compliance: ' + complianceData.score + ')');

        return {
            mergedPayload: mergedPayload,
            scores: {
                overall    : overallScore,
                correctness: correctnessData.quality_score.total,
                completeness: completenessData.score,
                compliance : complianceData.score,
                healthStatus: healthStatus,
                isStale    : correctnessData.is_stale,
                isOrphan   : correctnessData.is_orphan,
                hasDuplicates: correctnessData.duplicates.qualified_count > 0,
                violationsCount   : complianceData.violations_count,
                missingFieldsCount: completenessData.missing_count
            }
        };
    },

    // ─── SECTION A: COMPLETENESS ──────────────────────────────────────
    _runCompleteness: function() {
        gs.info('[CMDBHealthEvaluator] [' + this.ciSysId + '] Completeness — querying cmdb_recommended_fields for class: ' + this.ciClass);
        var recommendedFields = [];
        var recRec = new GlideRecord('cmdb_recommended_fields');
        recRec.addQuery('table', this.ciClass);
        recRec.query();
        if (recRec.next()) {
            var recStr = recRec.getValue('recommended');
            if (recStr) {
                var recArr = recStr.split(',');
                for (var ri = 0; ri < recArr.length; ri++) {
                    var fn = recArr[ri].trim();
                    if (!fn || !this.ci.isValidField(fn)) continue;
                    var el  = this.ci.getElement(fn);
                    var cur = (el && !el.nil()) ? el.getDisplayValue() : null;
                    recommendedFields.push({ field_name: fn, current_value: cur });
                }
            }
        } else {
            gs.warn('[CMDBHealthEvaluator] [' + this.ciSysId + '] Completeness — no recommended fields record found for class: ' + this.ciClass + '. Score will default to 100.');
        }

        var populatedFields = [];
        var missingFields   = [];
        for (var rfi = 0; rfi < recommendedFields.length; rfi++) {
            if (recommendedFields[rfi].current_value !== null) {
                populatedFields.push(recommendedFields[rfi].field_name);
            } else {
                missingFields.push(recommendedFields[rfi].field_name);
            }
        }

        var completenessScore = recommendedFields.length > 0
            ? Math.round((populatedFields.length / recommendedFields.length) * 100)
            : 100;

        gs.info('[CMDBHealthEvaluator] [' + this.ciSysId + '] Completeness — recommended: ' + recommendedFields.length +
            ', populated: ' + populatedFields.length + ', missing: ' + missingFields.length +
            ', score: ' + completenessScore);
        if (missingFields.length > 0) {
            gs.info('[CMDBHealthEvaluator] [' + this.ciSysId + '] Completeness — missing fields: [' + missingFields.join(', ') + ']');
        }

        var peerAnalysis       = [];
        var fieldsWithPeerData = {};

        gs.info('[CMDBHealthEvaluator] [' + this.ciSysId + '] Completeness — running peer analysis for ' + missingFields.length + ' missing field(s)');
        for (var pi = 0; pi < missingFields.length; pi++) {
            var pField = missingFields[pi];
            var qr     = this._runPeerQueryWithFallback(pField);
            var entry  = this._buildPeerEntry(pField, qr);
            gs.info('[CMDBHealthEvaluator] [' + this.ciSysId + '] Completeness — peer analysis for field "' + pField +
                '": peers=' + entry.peer_total_raw + ', consensus=' + entry.consensus_type +
                ', top_value=' + entry.top_value + ' (' + entry.top_value_pct + '%)' +
                (qr.fallback_used ? ' [fallback at step ' + qr.fallback_step + ']' : ''));
            peerAnalysis.push(entry);
            fieldsWithPeerData[pField] = true;
        }

        this._fieldsWithPeerData = fieldsWithPeerData;

        return {
            score            : completenessScore,
            recommended_count: recommendedFields.length,
            populated_count  : populatedFields.length,
            missing_count    : missingFields.length,
            missing_fields   : missingFields,
            peer_analysis    : peerAnalysis,
            thresholds: {
                min_peer_sample : this.MIN_PEER_SAMPLE,
                high_confidence : this.HIGH_CONFIDENCE_PCT,
                low_confidence  : this.LOW_CONFIDENCE_PCT
            }
        };
    },

    // ─── SECTION B: CORRECTNESS ───────────────────────────────────────
    _runCorrectness: function(completenessScore) {
        gs.info('[CMDBHealthEvaluator] [' + this.ciSysId + '] Correctness — checking discovery staleness (threshold: ' + this.STALE_THRESHOLD_DAYS + ' days)');
        var lastDiscVal  = this.ci.getValue('last_discovered');
        var discoveryAge = null;
        if (lastDiscVal) {
            var nowDt = new GlideDateTime();
            var lastDt = new GlideDateTime(lastDiscVal);
            discoveryAge = this._daysBetween(nowDt, lastDt);
        }
        var isStale = (discoveryAge === null) || (discoveryAge > this.STALE_THRESHOLD_DAYS);
        gs.info('[CMDBHealthEvaluator] [' + this.ciSysId + '] Correctness — last_discovered: ' +
            (lastDiscVal || 'NULL') + ', age: ' + (discoveryAge !== null ? discoveryAge + ' days' : 'unknown') +
            ', stale: ' + isStale);

        gs.info('[CMDBHealthEvaluator] [' + this.ciSysId + '] Correctness — querying relationships from cmdb_rel_ci');
        var relationships = this._getRelationships(this.ciSysId, this.ciOpStatus);
        gs.info('[CMDBHealthEvaluator] [' + this.ciSysId + '] Correctness — relationships: as_parent=' + relationships.as_parent +
            ', as_child=' + relationships.as_child + ', total=' + relationships.total + ', orphan=' + relationships.is_orphan);

        gs.info('[CMDBHealthEvaluator] [' + this.ciSysId + '] Correctness — querying incident count (lookback: ' + this.INCIDENT_LOOKBACK_DAYS + ' days)');
        var incidentCount = this._getIncidentCount(this.ciSysId);
        gs.info('[CMDBHealthEvaluator] [' + this.ciSysId + '] Correctness — incident_count: ' + incidentCount);

        var qualityScore = this._calcQualityScore(completenessScore, discoveryAge, relationships.total, incidentCount);
        gs.info('[CMDBHealthEvaluator] [' + this.ciSysId + '] Correctness — quality score: ' + qualityScore.total +
            ' (completeness_component=' + qualityScore.components.completeness.score +
            ', discovery_component=' + qualityScore.components.discovery.score +
            ', relationships_component=' + qualityScore.components.relationships.score +
            ', incidents_component=' + qualityScore.components.incidents.score + ')');

        gs.info('[CMDBHealthEvaluator] [' + this.ciSysId + '] Correctness — running duplicate detection on identifiers: [' + this.DUPLICATE_IDENTIFIERS.join(', ') + ']');
        var duplicateData = this._findDuplicates(qualityScore.total, isStale);
        gs.info('[CMDBHealthEvaluator] [' + this.ciSysId + '] Correctness — duplicates: total_found=' + duplicateData.total_found +
            ', qualified=' + duplicateData.qualified_count +
            (duplicateData.qualified_count > 0 ? ' *** POTENTIAL DUPLICATES DETECTED ***' : ''));

        return {
            quality_score : qualityScore,
            is_stale      : isStale,
            is_orphan     : relationships.is_orphan,
            discovery: {
                last_discovered    : lastDiscVal || null,
                discovery_age_days : discoveryAge,
                stale_threshold    : this.STALE_THRESHOLD_DAYS
            },
            relationships : relationships,
            incident_count: incidentCount,
            duplicates    : duplicateData,
            governance    : this.governance
        };
    },

    // ─── SECTION C: COMPLIANCE ────────────────────────────────────────
    _runCompliance: function() {
        gs.info('[CMDBHealthEvaluator] [' + this.ciSysId + '] Compliance — querying cert_template for class: ' + this.ciClass);
        var templates = [];
        var tmplRec = new GlideRecord('cert_template');
        tmplRec.addQuery('table', this.ciClass);
        tmplRec.query();
        while (tmplRec.next()) {
            var tmplIsReg = this._isRegulatoryTemplate(tmplRec.getDisplayValue('name'), tmplRec.getValue('description'));
            templates.push({
                sys_id       : tmplRec.getUniqueValue(),
                name         : tmplRec.getDisplayValue('name'),
                description  : tmplRec.getValue('description'),
                is_regulatory: tmplIsReg
            });
            gs.info('[CMDBHealthEvaluator] [' + this.ciSysId + '] Compliance — found template: "' + tmplRec.getDisplayValue('name') + '" (regulatory: ' + tmplIsReg + ')');
        }

        if (templates.length === 0) {
            gs.info('[CMDBHealthEvaluator] [' + this.ciSysId + '] Compliance — no cert_template records found for class: ' + this.ciClass + '. Score defaults to 100.');
        } else {
            gs.info('[CMDBHealthEvaluator] [' + this.ciSysId + '] Compliance — evaluating rules across ' + templates.length + ' template(s)');
        }

        var violationMap   = {};
        var totalRulesEval = 0;
        var rulesPassed    = 0;
        var skippedCount   = 0;

        for (var t = 0; t < templates.length; t++) {
            var tmplRulesEval = 0; var tmplRulesPassed = 0; var tmplSkipped = 0;
            var condRec = new GlideRecord('cert_attr_cond');
            condRec.addQuery('cert_template', templates[t].sys_id);
            condRec.query();
            while (condRec.next()) {
                var cfld = condRec.getValue('column_name');
                if (!this.ci.isValidField(cfld)) { tmplSkipped++; skippedCount++; continue; }
                var opCode = this._resolveOpCode(condRec.getValue('condition'), condRec.getValue('op_label'), cfld);
                if (!opCode) { tmplSkipped++; skippedCount++; continue; }
                var result = this._evaluateRule(cfld, opCode, condRec.getValue('desired_value'));
                if (result.skipped) { tmplSkipped++; skippedCount++; continue; }
                totalRulesEval++; tmplRulesEval++;
                if (!result.violated) { rulesPassed++; tmplRulesPassed++; continue; }
                if (!violationMap[cfld]) {
                    var desVal = condRec.getValue('desired_value');
                    var isDeterministic = (opCode === 'eq' && result.type !== 'BLANK_FIELD' && desVal);
                    violationMap[cfld] = {
                        field             : cfld,
                        actual_value      : this.ci.getDisplayValue(cfld),
                        operator_code     : opCode,
                        expected_value    : desVal,
                        violation_type    : result.type === 'BLANK_FIELD' ? 'BLANK_FIELD' : 'WRONG_VALUE',
                        is_deterministic  : isDeterministic,
                        suggested_fix     : isDeterministic ? desVal : null,
                        suggested_range   : this._getSuggestedRange(opCode, desVal),
                        templates_affected: [templates[t].name],
                        is_regulatory     : templates[t].is_regulatory,
                        priority_level    : null,
                        peer_benchmark    : null
                    };
                } else {
                    violationMap[cfld].templates_affected.push(templates[t].name);
                    if (templates[t].is_regulatory) violationMap[cfld].is_regulatory = true;
                }
            }
            gs.info('[CMDBHealthEvaluator] [' + this.ciSysId + '] Compliance — template "' + templates[t].name +
                '": rules_evaluated=' + tmplRulesEval + ', passed=' + tmplRulesPassed +
                ', skipped=' + tmplSkipped + ', violations_so_far=' + Object.keys(violationMap).length);
        }

        var mergedViolations = [];
        for (var vKey in violationMap) {
            var mv = violationMap[vKey];
            mv.priority_level = mv.is_regulatory ? 'CRITICAL'
                              : mv.templates_affected.length > 1 ? 'HIGH' : 'MEDIUM';
            mergedViolations.push(mv);
        }
        mergedViolations.sort(function(a, b) {
            var order = { CRITICAL: 0, HIGH: 1, MEDIUM: 2 };
            return (order[a.priority_level] || 2) - (order[b.priority_level] || 2);
        });

        // Attach peer benchmarks to violations
        for (var vi = 0; vi < mergedViolations.length; vi++) {
            var vField = mergedViolations[vi].field;
            if (this._fieldsWithPeerData && this._fieldsWithPeerData[vField]) {
                mergedViolations[vi].peer_benchmark = {
                    source: 'completeness_peer_analysis',
                    note  : 'Peer data for this field is in completeness.peer_analysis. Use it.'
                };
            } else {
                var vqr = this._runPeerQueryWithFallback(vField);
                mergedViolations[vi].peer_benchmark = this._buildPeerEntry(vField, vqr);
            }
            gs.info('[CMDBHealthEvaluator] [' + this.ciSysId + '] Compliance — violation: field="' + vField +
                '", type=' + mergedViolations[vi].violation_type +
                ', priority=' + mergedViolations[vi].priority_level +
                ', actual="' + mergedViolations[vi].actual_value + '"' +
                ', expected="' + mergedViolations[vi].expected_value + '"');
        }

        var complianceScore = totalRulesEval > 0
            ? Math.round((rulesPassed / totalRulesEval) * 100) : 100;

        var hasCritical = false;
        for (var ci2 = 0; ci2 < mergedViolations.length; ci2++) {
            if (mergedViolations[ci2].priority_level === 'CRITICAL') { hasCritical = true; break; }
        }

        gs.info('[CMDBHealthEvaluator] [' + this.ciSysId + '] Compliance — SUMMARY: templates=' + templates.length +
            ', total_rules_evaluated=' + totalRulesEval + ', passed=' + rulesPassed +
            ', skipped=' + skippedCount + ', violations=' + mergedViolations.length +
            ', has_regulatory_violation=' + hasCritical + ', score=' + complianceScore);

        return {
            score              : complianceScore,
            total_rules_eval   : totalRulesEval,
            rules_passed       : rulesPassed,
            violations_count   : mergedViolations.length,
            templates_count    : templates.length,
            has_regulatory     : hasCritical,
            skipped_rules_count: skippedCount,
            violations         : mergedViolations
        };
    },

    // ─── PEER QUERY UTILITIES ─────────────────────────────────────────
    _runPeerQueryWithFallback: function(field) {
        var steps = [];
        steps.push({ cls: this.fallbackChain[0], envScoped: true, label: 'original_class+env' });
        for (var f = 1; f < this.fallbackChain.length; f++) {
            steps.push({ cls: this.fallbackChain[f], envScoped: true,  label: 'parent_level_' + f + '+env' });
        }
        for (var g = 1; g < this.fallbackChain.length; g++) {
            steps.push({ cls: this.fallbackChain[g], envScoped: false, label: 'parent_level_' + g + '+all_envs' });
        }
        steps.push({ cls: 'cmdb_ci', envScoped: false, label: 'cmdb_ci_root+all_envs' });

        for (var s = 0; s < steps.length; s++) {
            var envToPass = steps[s].envScoped ? this.ciEnvironment : null;
            var result    = this._runPeerQuery(field, steps[s].cls, envToPass);
            if (result.peerTotalRaw >= this.MIN_PEER_SAMPLE) {
                return { data: result, class_used: steps[s].cls, env_scoped: steps[s].envScoped,
                         label: steps[s].label, fallback_used: s > 0, fallback_step: s };
            }
        }
        var lastStep   = steps[steps.length - 1];
        var lastResult = this._runPeerQuery(field, lastStep.cls, null);
        return { data: lastResult, class_used: lastStep.cls, env_scoped: false,
                 label: 'exhausted_all_fallbacks', fallback_used: true, fallback_step: steps.length };
    },

    _runPeerQuery: function(field, queryClass, envValue) {
        var agg = new GlideAggregate(queryClass);
        agg.addNotNullQuery(field);
        agg.addQuery('sys_id', '!=', this.ciSysId);
        if (this.SCOPE_PEERS_BY_ENV && envValue) {
            var testRec = new GlideRecord(queryClass);
            if (testRec.isValidField('environment')) agg.addQuery('environment', envValue);
        }
        agg.addAggregate('COUNT', field);
        agg.groupBy(field);
        agg.orderByAggregate('COUNT', field);
        agg.setLimit(this.PEER_QUERY_LIMIT);
        agg.query();

        var rawValues = []; var peerTotalRaw = 0;
        while (agg.next()) {
            var cnt = parseInt(agg.getAggregate('COUNT', field), 10);
            peerTotalRaw += cnt;
            rawValues.push({ value: agg.getValue(field), count: cnt });
        }

        var normMap = {}; var normTotal = 0;
        for (var r = 0; r < rawValues.length; r++) {
            var norm = this._normalizeValue(rawValues[r].value);
            if (!normMap[norm]) normMap[norm] = { normalized_value: norm, count: 0, raw_variants: [] };
            normMap[norm].count += rawValues[r].count;
            normMap[norm].raw_variants.push(rawValues[r].value);
        }
        var normValues = [];
        for (var key in normMap) { normValues.push(normMap[key]); normTotal += normMap[key].count; }
        normValues.sort(function(a, b) { return b.count - a.count; });
        return { peerTotalRaw: peerTotalRaw, normalizedTotal: normTotal, normalizedValues: normValues };
    },

    _buildPeerEntry: function(field, qr) {
        var pData    = qr.data;
        var topVals  = pData.normalizedValues.slice(0, this.MAX_PEER_VALUES);
        var topPct   = 0; var conType = 'UNKNOWN'; var confLevel = 'INSUFFICIENT_DATA';
        if (pData.peerTotalRaw >= this.MIN_PEER_SAMPLE && topVals.length > 0) {
            topPct    = (topVals[0].count / pData.normalizedTotal) * 100;
            conType   = topPct >= this.HIGH_CONFIDENCE_PCT ? 'STRONG_STANDARD'
                      : topPct <= this.LOW_CONFIDENCE_PCT  ? 'STATISTICAL_NOISE'
                      :                                      'MEDIUM_CONFIDENCE';
            confLevel = pData.peerTotalRaw > 50  ? 'HIGH_SAMPLE'
                      : pData.peerTotalRaw >= 15 ? 'MEDIUM_SAMPLE' : 'LOW_SAMPLE';
        }
        var entry = {
            field         : field,
            peer_total_raw: pData.peerTotalRaw,
            consensus_type: conType,
            conf_level    : confLevel,
            fallback_used : qr.fallback_used,
            top_value     : topVals.length > 0 ? topVals[0].normalized_value : null,
            top_value_pct : Math.round(topPct)
        };
        if (conType === 'STRONG_STANDARD' || conType === 'MEDIUM_CONFIDENCE') {
            entry.top_values = topVals.slice(0, 3);
        }
        if (qr.fallback_used) {
            entry.fallback_note = 'Scope widened at step ' + qr.fallback_step + ' (' + qr.label + ').';
        }
        return entry;
    },

    // ─── DUPLICATE DETECTION ─────────────────────────────────────────
    _findDuplicates: function(targetQualityTotal, isStale) {
        var matchMap = {}; var matchOrder = [];
        for (var i = 0; i < this.DUPLICATE_IDENTIFIERS.length; i++) {
            var fld = this.DUPLICATE_IDENTIFIERS[i];
            var val = this.ci.getValue(fld);
            if (!this._isValidIdentifier(val)) {
                gs.info('[CMDBHealthEvaluator] [' + this.ciSysId + '] Duplicates — skipping identifier "' + fld + '" (blank or junk value)');
                continue;
            }
            gs.info('[CMDBHealthEvaluator] [' + this.ciSysId + '] Duplicates — checking identifier "' + fld + '" = "' + val + '" against cmdb_ci INSTANCEOF ' + this.ciClass);
            var dupRec = new GlideRecord('cmdb_ci');
            dupRec.addQuery('sys_class_name', 'INSTANCEOF', this.ciClass);
            dupRec.addQuery(fld, val);
            dupRec.addQuery('sys_id', '!=', this.ciSysId);
            dupRec.query();
            var matchesForField = 0;
            while (dupRec.next()) {
                var dsid = dupRec.getUniqueValue();
                if (!matchMap[dsid]) {
                    matchMap[dsid] = { sys_id: dsid, ci_class: dupRec.getValue('sys_class_name'), matches: [] };
                    matchOrder.push(dsid);
                }
                matchMap[dsid].matches.push({ field: fld, value: val });
                matchesForField++;
            }
            gs.info('[CMDBHealthEvaluator] [' + this.ciSysId + '] Duplicates — identifier "' + fld + '": found ' + matchesForField + ' candidate(s)');
        }
        var scored = [];
        for (var j = 0; j < matchOrder.length; j++) {
            var entry   = matchMap[matchOrder[j]];
            var fullRec = new GlideRecord(entry.ci_class);
            if (!fullRec.get(entry.sys_id)) continue;
            var dupSigs = this._buildDupSignals(fullRec);
            var conf    = this._calcDupConfidence(targetQualityTotal, dupSigs, entry.matches, isStale);
            if (conf < this.DUPLICATE_MIN_CONFIDENCE) continue;
            scored.push({ signals: dupSigs, matches: entry.matches, confidence: conf });
        }
        scored.sort(function(a, b) {
            if (b.confidence !== a.confidence) return b.confidence - a.confidence;
            var ageA = a.signals.discovery.discovery_age_days;
            var ageB = b.signals.discovery.discovery_age_days;
            return (ageA === null ? 9999 : ageA) - (ageB === null ? 9999 : ageB);
        });
        var topDups = [];
        for (var k = 0; k < scored.length && k < this.DUPLICATE_DETAIL_LIMIT; k++) {
            var item = scored[k];
            topDups.push({
                name              : item.signals.name,
                sys_id            : item.signals.sys_id,
                operational_status: item.signals.operational_status,
                discovery_age_days: item.signals.discovery.discovery_age_days,
                is_stale          : item.signals.discovery.is_stale,
                relationships     : item.signals.relationships,
                incident_count    : item.signals.incident_count,
                quality_score     : item.signals.quality_score,
                identifier_matches: item.matches,
                confidence        : item.confidence
            });
        }
        return { total_found: matchOrder.length, qualified_count: scored.length,
                 truncated: scored.length > this.DUPLICATE_DETAIL_LIMIT,
                 detail_limit: this.DUPLICATE_DETAIL_LIMIT, top_duplicates: topDups };
    },

    _buildDupSignals: function(record) {
        var sid = record.getUniqueValue();
        if (this._dupCache[sid]) return this._dupCache[sid];
        var ldv = record.getValue('last_discovered'); var dAge = null;
        if (ldv) { var n2 = new GlideDateTime(); var l2 = new GlideDateTime(ldv); dAge = this._daysBetween(n2, l2); }
        var ops  = record.getValue('operational_status');
        var rels = this._getRelationships(sid, ops);
        var incs = this._getIncidentCount(sid);
        var dupCheckFields = ['name','ip_address','fqdn','serial_number','supported_by','owned_by','environment','operational_status'];
        var filled = 0;
        for (var df = 0; df < dupCheckFields.length; df++) {
            if (record.isValidField(dupCheckFields[df])) {
                var dv = record.getValue(dupCheckFields[df]);
                if (dv && dv.toString().trim() !== '') filled++;
            }
        }
        var dupCompScore = Math.round((filled / dupCheckFields.length) * 100);
        var dupQuality   = this._calcQualityScore(dupCompScore, dAge, rels.total, incs);
        var sigs = {
            name: record.getDisplayValue('name'), sys_id: sid,
            operational_status: record.getDisplayValue('operational_status'),
            discovery: { discovery_age_days: dAge, is_stale: (dAge === null || dAge > this.STALE_THRESHOLD_DAYS) },
            relationships: rels, incident_count: incs, quality_score: dupQuality.total
        };
        this._dupCache[sid] = sigs;
        return sigs;
    },

    _calcDupConfidence: function(targetQualityTotal, dupSigs, matches, isStale) {
        var score = 0;
        for (var i = 0; i < matches.length; i++) score += this.IDENTIFIER_WEIGHTS[matches[i].field] || 0;
        if (matches.length > 1) score += 20;
        if (isStale && dupSigs.discovery.is_stale) score -= 15;
        if (dupSigs.quality_score > targetQualityTotal) score += 10;
        return Math.max(0, Math.min(100, score));
    },

    // ─── SHARED UTILITIES ─────────────────────────────────────────────
    _getClassFallbackChain: function(startClass) {
        var chain = [startClass]; var cursor = startClass;
        for (var depth = 0; depth < this.MAX_HIERARCHY_DEPTH; depth++) {
            var obj = new GlideRecord('sys_db_object');
            obj.addQuery('name', cursor); obj.query();
            if (!obj.next()) break;
            var superRef = obj.getValue('super_class');
            if (!superRef) break;
            var parent = new GlideRecord('sys_db_object');
            parent.get(superRef);
            if (!parent.isValidRecord()) break;
            var parentName = parent.getValue('name');
            if (!parentName || parentName === cursor) break;
            chain.push(parentName); cursor = parentName;
            if (parentName === 'cmdb_ci') break;
        }
        if (chain[chain.length - 1] !== 'cmdb_ci') chain.push('cmdb_ci');
        gs.info('[CMDBHealthEvaluator] [' + this.ciSysId + '] Class hierarchy fallback chain: [' + chain.join(' → ') + ']');
        return chain;
    },

    _daysBetween: function(newer, older) {
        return Math.floor((newer.getNumericValue() - older.getNumericValue()) / 86400000);
    },

    _isValidIdentifier: function(val) {
        if (!val) return false;
        var v = val.toString().toLowerCase().trim();
        var junk = ['na', 'n/a', 'unknown', 'localhost', '127.0.0.1', '0.0.0.0', 'none', ''];
        for (var i = 0; i < junk.length; i++) { if (v === junk[i]) return false; }
        return true;
    },

    _getIncidentCount: function(sysId) {
        var cutoff = new GlideDateTime(); cutoff.addDaysUTC(-this.INCIDENT_LOOKBACK_DAYS);
        var agg = new GlideAggregate('incident');
        agg.addAggregate('COUNT'); agg.addQuery('cmdb_ci', sysId);
        agg.addQuery('sys_created_on', '>=', cutoff); agg.query();
        return agg.next() ? parseInt(agg.getAggregate('COUNT'), 10) : 0;
    },

    _getRelationships: function(sysId, opStatus) {
        var aggC = new GlideAggregate('cmdb_rel_ci');
        aggC.addAggregate('COUNT'); aggC.addQuery('child', sysId); aggC.query();
        var childCount = aggC.next() ? parseInt(aggC.getAggregate('COUNT'), 10) : 0;
        var aggP = new GlideAggregate('cmdb_rel_ci');
        aggP.addAggregate('COUNT'); aggP.addQuery('parent', sysId); aggP.query();
        var parentCount = aggP.next() ? parseInt(aggP.getAggregate('COUNT'), 10) : 0;
        var total = parentCount + childCount;
        return { as_parent: parentCount, as_child: childCount, total: total,
                 is_orphan: (total === 0 && opStatus === this.OP_STATUS_ACTIVE) };
    },

    _calcQualityScore: function(compScore, discAge, relTotal, incCnt) {
        var c   = Math.round((compScore / 100) * 40);
        var d   = discAge !== null ? Math.round(Math.max(0, (365 - discAge) / 365) * 30) : 0;
        var r   = Math.min(relTotal, 10) * 2;
        var inc = Math.min(incCnt, 10);
        return { total: c + d + r + inc,
                 components: { completeness: { score: c, max: 40 }, discovery: { score: d, max: 30 },
                               relationships: { score: r, max: 20 }, incidents: { score: inc, max: 10 } } };
    },

    _normalizeValue: function(v) {
        if (!v) return v;
        var t = v.toString().trim();
        for (var i = 0; i < this.NORM_RULES.length; i++) {
            if (this.NORM_RULES[i].p.test(t)) return this.NORM_RULES[i].n;
        }
        return t;
    },

    _isRegulatoryTemplate: function(name, desc) {
        var combined = ((name || '') + ' ' + (desc || '')).toLowerCase();
        for (var i = 0; i < this.REGULATORY_KEYWORDS.length; i++) {
            if (combined.indexOf(this.REGULATORY_KEYWORDS[i]) !== -1) return true;
        }
        return false;
    },

    _extractOpFromCondition: function(condStr, fieldName) {
        if (!condStr || !fieldName) return null;
        var clean = condStr.replace(/\^EQ$/i, '').replace(/\^$/, '').trim();
        var rem = clean;
        if (clean.toLowerCase().indexOf(fieldName.toLowerCase()) === 0) rem = clean.substring(fieldName.length);
        for (var i = 0; i < this.COND_OP_SYMBOLS.length; i++) {
            if (rem.toUpperCase().indexOf(this.COND_OP_SYMBOLS[i].sym) === 0) return this.COND_OP_SYMBOLS[i].code;
        }
        return null;
    },

    _resolveOpCode: function(condStr, opLabel, fieldName) {
        var fromCond = this._extractOpFromCondition(condStr, fieldName);
        if (fromCond) return fromCond;
        if (opLabel) {
            var norm = opLabel.toString().toLowerCase().trim();
            if (this.OP_LABEL_REVERSE[norm]) return this.OP_LABEL_REVERSE[norm];
        }
        return null;
    },

    _getSuggestedRange: function(opCode, desiredValue) {
        var val = parseFloat(desiredValue); if (isNaN(val)) return null;
        if (opCode === 'gt')  return { min_exclusive: val };
        if (opCode === 'gte') return { min_inclusive: val };
        if (opCode === 'lt')  return { max_exclusive: val };
        if (opCode === 'lte') return { max_inclusive: val };
        return null;
    },

    _evaluateRule: function(fieldName, opCode, desiredValue) {
        var actualRaw     = this.ci.getValue(fieldName);
        var actualDisplay = this.ci.getDisplayValue(fieldName);
        var isBlank       = (actualRaw === null || actualRaw === '' || actualRaw === undefined);
        if (opCode === 'is_empty')     return { violated: !isBlank, type: 'presence_check' };
        if (opCode === 'is_not_empty') return { violated: isBlank,  type: 'presence_check' };
        if (isBlank)                   return { violated: true,     type: 'BLANK_FIELD'    };
        var actualNum = parseFloat(actualRaw); var desiredNum = parseFloat(desiredValue);
        var isNum = !isNaN(actualNum) && !isNaN(desiredNum);
        if (isNum && ['gt', 'lt', 'gte', 'lte'].indexOf(opCode) !== -1) {
            var numVio = false;
            if (opCode === 'gt')  numVio = actualNum <= desiredNum;
            if (opCode === 'lt')  numVio = actualNum >= desiredNum;
            if (opCode === 'gte') numVio = actualNum <  desiredNum;
            if (opCode === 'lte') numVio = actualNum >  desiredNum;
            return { violated: numVio, type: 'numeric' };
        }
        if (opCode === 'eq') {
            return { violated: (actualRaw !== desiredValue && actualDisplay !== desiredValue), type: 'string' };
        }
        return { violated: false, type: 'unsupported_operator', skipped: true };
    },

    type: 'CMDBHealthEvaluator'
};
