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
            return null
        }
        if (!systemPrompt) {
            gs.error('[CMDBHealthLLM] CI ' + ciSysId + ' (' + ciName + ') — cmdb_health.llm.system_prompt not set.')
            return null
        }
        if (!apiKey) {
            gs.error('[CMDBHealthLLM] CI ' + ciSysId + ' (' + ciName + ') — cmdb_health.llm.api_key not set.')
            return null
        }

        gs.info('[CMDBHealthLLM] CI ' + ciSysId + ' (' + ciName + ') — Phase 2 starting: sending payload to LLM endpoint')

        var callStartMs = new GlideDateTime().getNumericValue()

        try {
            // Gemini auth is a URL query parameter — matches your existing integration
            var fullEndpoint = endpoint + '?key=' + apiKey

            var request = new sn_ws.RESTMessageV2()
            request.setEndpoint(fullEndpoint)
            request.setHttpMethod('POST')
            request.setRequestHeader('Content-Type', 'application/json')

            var payloadStr = typeof mergedPayload === 'string' ? mergedPayload : JSON.stringify(mergedPayload)

            // Request body matches your proven working pattern exactly —
            // system prompt and user payload both go into contents[0].parts[]
            var requestBody = {
                contents: [
                    {
                        parts: [{ text: systemPrompt }, { text: payloadStr }],
                    },
                ],
                generationConfig: {
                    temperature: 0.1,
                    maxOutputTokens: 16384,
                },
            }

            request.setRequestBody(JSON.stringify(requestBody))

            gs.info('[CMDBHealthLLM] CI ' + ciSysId + ' — REST request dispatched, awaiting LLM response...')
            var response = request.execute()
            var statusCode = response.getStatusCode()
            var body = response.getBody()

            var elapsedMs = new GlideDateTime().getNumericValue() - callStartMs
            gs.info('[CMDBHealthLLM] CI ' + ciSysId + ' — HTTP ' + statusCode + ' received in ' + elapsedMs + 'ms')

            if (statusCode !== 200) {
                gs.error('[CMDBHealthLLM] CI ' + ciSysId + ' — Non-200 response: ' + statusCode)
                gs.error('[CMDBHealthLLM] CI ' + ciSysId + ' — Response body: ' + body)
                return null
            }

            // Response parsing matches your proven working pattern exactly
            var answer = ''
            try {
                var obj = JSON.parse(body)

                if (
                    obj.candidates &&
                    obj.candidates.length > 0 &&
                    obj.candidates[0].content &&
                    obj.candidates[0].content.parts &&
                    obj.candidates[0].content.parts.length > 0 &&
                    obj.candidates[0].content.parts[0].text
                ) {
                    answer = obj.candidates[0].content.parts[0].text
                } else if (obj.error && obj.error.message) {
                    gs.error('[CMDBHealthLLM] CI ' + ciSysId + ' — Gemini API error: ' + obj.error.message)
                    return null
                } else {
                    gs.error('[CMDBHealthLLM] CI ' + ciSysId + ' — Unexpected response structure: ' + body)
                    return null
                }
            } catch (parseErr) {
                gs.error('[CMDBHealthLLM] CI ' + ciSysId + ' — Failed to parse Gemini envelope: ' + parseErr.message)
                return null
            }

            // Strip markdown fences defensively — Gemini sometimes wraps JSON in ```json
            answer = answer
                .replace(/^```json\s*/i, '')
                .replace(/^```\s*/i, '')
                .replace(/\s*```$/i, '')
                .trim()

            // Parse the cleaned JSON — this is your LLM response object
            var parsed = JSON.parse(answer)
            gs.info('[CMDBHealthLLM] CI ' + ciSysId + ' (' + ciName + ') — Phase 2 COMPLETE: LLM response parsed successfully')
            return parsed
        } catch (e) {
            gs.error('[CMDBHealthLLM] CI ' + ciSysId + ' (' + ciName + ') — Call FAILED: ' + e.message)
            return null
        }
    },

    type: 'CMDBHealthLLM',
}
