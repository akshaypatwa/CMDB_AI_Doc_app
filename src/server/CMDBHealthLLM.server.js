// CMDBHealthLLM — Script Include that sends CMDB health payload to a configured LLM endpoint
// (Gemini by default) and returns the parsed JSON response for downstream processing.
var CMDBHealthLLM = Class.create()
CMDBHealthLLM.prototype = {
    initialize: function () {},

    call: function (mergedPayload) {
        var ciSysId = (mergedPayload && mergedPayload.ci) ? mergedPayload.ci.sys_id : 'unknown'
        var ciName  = (mergedPayload && mergedPayload.ci) ? mergedPayload.ci.name   : 'unknown'

        var endpoint = gs.getProperty('x_epams_cmdb_healt.llm.endpoint', '')
        var apiKey = gs.getProperty('x_epams_cmdb_healt.llm.api_key', '')
        var systemPrompt = gs.getProperty('x_epams_cmdb_healt.llm.system_prompt', '')

        if (!endpoint) {
            gs.error('[CMDBHealthLLM] CI ' + ciSysId + ' (' + ciName + ') — cmdb_health.llm.endpoint not set.')
            return { ok: false, reason: 'cmdb_health.llm.endpoint not set' }
        }
        if (!systemPrompt) {
            gs.error('[CMDBHealthLLM] CI ' + ciSysId + ' (' + ciName + ') — cmdb_health.llm.system_prompt not set.')
            return { ok: false, reason: 'cmdb_health.llm.system_prompt not set' }
        }
        if (!apiKey) {
            gs.error('[CMDBHealthLLM] CI ' + ciSysId + ' (' + ciName + ') — cmdb_health.llm.api_key not set.')
            return { ok: false, reason: 'cmdb_health.llm.api_key not set' }
        }

        gs.info('[CMDBHealthLLM] CI ' + ciSysId + ' (' + ciName + ') — Phase 2 starting: sending payload to LLM endpoint')

        var fullEndpoint = endpoint + '?key=' + apiKey
        var payloadStr = typeof mergedPayload === 'string' ? mergedPayload : JSON.stringify(mergedPayload)
        var requestBody = {
            contents: [{ parts: [{ text: systemPrompt }, { text: payloadStr }] }],
            generationConfig: { temperature: 0.1, maxOutputTokens: 16384 },
        }
        var requestBodyStr = JSON.stringify(requestBody)

        // Retry transient failures (HTTP 408/429/5xx + network exceptions). Backoff: 1s, 3s.
        var MAX_ATTEMPTS = 3
        var BACKOFF_MS = [1000, 3000]
        var lastReason = 'unknown failure'

        for (var attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
            var callStartMs = new GlideDateTime().getNumericValue()
            try {
                var request = new sn_ws.RESTMessageV2()
                request.setEndpoint(fullEndpoint)
                request.setHttpMethod('POST')
                request.setRequestHeader('Content-Type', 'application/json')
                request.setHttpTimeout(60000)
                request.setRequestBody(requestBodyStr)

                gs.info('[CMDBHealthLLM] CI ' + ciSysId + ' — REST attempt ' + attempt + '/' + MAX_ATTEMPTS + ' dispatched...')
                var response = request.execute()
                var statusCode = response.getStatusCode()
                var body = response.getBody()
                var elapsedMs = new GlideDateTime().getNumericValue() - callStartMs
                gs.info('[CMDBHealthLLM] CI ' + ciSysId + ' — HTTP ' + statusCode + ' in ' + elapsedMs + 'ms (attempt ' + attempt + ')')

                if (statusCode !== 200) {
                    var bodySnippet = (body || '').substring(0, 300)
                    lastReason = 'HTTP ' + statusCode + ': ' + bodySnippet
                    gs.error('[CMDBHealthLLM] CI ' + ciSysId + ' — Non-200 (attempt ' + attempt + '): ' + lastReason)
                    // Retry on 408/429/5xx
                    var transient = (statusCode == 408 || statusCode == 429 || statusCode >= 500)
                    if (transient && attempt < MAX_ATTEMPTS) {
                        this._wait(BACKOFF_MS[attempt - 1])
                        continue
                    }
                    return { ok: false, reason: lastReason }
                }

                var answer = ''
                try {
                    var obj = JSON.parse(body)
                    if (obj.candidates && obj.candidates.length > 0 &&
                        obj.candidates[0].content && obj.candidates[0].content.parts &&
                        obj.candidates[0].content.parts.length > 0 &&
                        obj.candidates[0].content.parts[0].text) {
                        answer = obj.candidates[0].content.parts[0].text
                    } else if (obj.error && obj.error.message) {
                        lastReason = 'Gemini API error: ' + obj.error.message
                        gs.error('[CMDBHealthLLM] CI ' + ciSysId + ' — ' + lastReason)
                        return { ok: false, reason: lastReason }
                    } else {
                        lastReason = 'Unexpected response structure: ' + (body || '').substring(0, 300)
                        gs.error('[CMDBHealthLLM] CI ' + ciSysId + ' — ' + lastReason)
                        return { ok: false, reason: lastReason }
                    }
                } catch (parseErr) {
                    lastReason = 'Failed to parse Gemini envelope: ' + parseErr.message
                    gs.error('[CMDBHealthLLM] CI ' + ciSysId + ' — ' + lastReason)
                    return { ok: false, reason: lastReason }
                }

                answer = answer
                    .replace(/^```json\s*/i, '')
                    .replace(/^```\s*/i, '')
                    .replace(/\s*```$/i, '')
                    .trim()

                try {
                    var parsed = JSON.parse(answer)
                    gs.info('[CMDBHealthLLM] CI ' + ciSysId + ' (' + ciName + ') — Phase 2 COMPLETE: LLM response parsed')
                    return parsed
                } catch (jsonErr) {
                    lastReason = 'LLM returned non-JSON content: ' + jsonErr.message
                    gs.error('[CMDBHealthLLM] CI ' + ciSysId + ' — ' + lastReason)
                    return { ok: false, reason: lastReason }
                }

            } catch (e) {
                lastReason = 'REST exception: ' + e.message
                gs.error('[CMDBHealthLLM] CI ' + ciSysId + ' — Attempt ' + attempt + ' FAILED: ' + lastReason)
                if (attempt < MAX_ATTEMPTS) {
                    gs.sleep(BACKOFF_MS[attempt - 1])
                    continue
                }
                return { ok: false, reason: lastReason }
            }
        }

        return { ok: false, reason: lastReason }
    },

    // Scoped apps don't expose gs.sleep; busy-wait via GlideDateTime delta.
    _wait: function (ms) {
        var start = new GlideDateTime().getNumericValue()
        while ((new GlideDateTime().getNumericValue() - start) < ms) { /* spin */ }
    },

    type: 'CMDBHealthLLM',
}
