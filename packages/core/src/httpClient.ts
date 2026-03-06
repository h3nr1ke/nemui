import axios, { AxiosRequestConfig, AxiosError } from 'axios';
import type { ApiRequest, ApiResponse, AppState } from './types';

export interface HttpClientOptions {
    timeout?: number;
    followRedirects?: boolean;
    verifySsl?: boolean;
}

export function createHttpClient(getState: () => AppState) {
    return async function sendRequest(request: ApiRequest): Promise<ApiResponse> {
        const state = getState();
        const { resolveVariables } = state;
        const config = state.config;
        
        const startTime = Date.now();
        
        try {
            // Resolve variables in URL
            let url = resolveVariables(request.url);
            
            // Build URL with query params
            const enabledParams = request.queryParams.filter(p => p.enabled && p.key);
            const resolvedParams = enabledParams.map(p => ({
                ...p,
                key: resolveVariables(p.key),
                value: resolveVariables(p.value)
            }));
            
            if (resolvedParams.length > 0) {
                const params = new URLSearchParams();
                resolvedParams.forEach(p => params.append(p.key, p.value));
                url += (url.includes('?') ? '&' : '?') + params.toString();
            }

            // Build headers
            const headers: Record<string, string> = {};
            request.headers.filter(h => h.enabled && h.key).forEach(h => {
                headers[resolveVariables(h.key)] = resolveVariables(h.value);
            });

            // Add auth
            if (request.auth) {
                switch (request.auth.type) {
                    case 'bearer':
                        headers['Authorization'] = `Bearer ${resolveVariables(request.auth.token || '')}`;
                        break;
                    case 'basic':
                        const credentials = Buffer.from(
                            `${resolveVariables(request.auth.username || '')}:${resolveVariables(request.auth.password || '')}`
                        ).toString('base64');
                        headers['Authorization'] = `Basic ${credentials}`;
                        break;
                    case 'api-key':
                        if (request.auth.addTo === 'header') {
                            headers[request.auth.key || 'X-API-Key'] = resolveVariables(request.auth.value || '');
                        }
                        break;
                }
            }

            // Build body
            let data: unknown = undefined;
            if (['POST', 'PUT', 'PATCH'].includes(request.method) && request.bodyType !== 'none') {
                const resolvedBody = resolveVariables(request.body);
                
                switch (request.bodyType) {
                    case 'json':
                        try {
                            data = JSON.parse(resolvedBody);
                            headers['Content-Type'] = 'application/json';
                        } catch {
                            data = resolvedBody;
                        }
                        break;
                    case 'form-data':
                        data = resolvedBody;
                        break;
                    case 'graphql':
                        try {
                            const parsed = JSON.parse(resolvedBody);
                            data = parsed;
                            headers['Content-Type'] = 'application/json';
                        } catch {
                            data = { query: resolvedBody };
                        }
                        break;
                    default:
                        data = resolvedBody;
                }
            }

            const axiosConfig: AxiosRequestConfig = {
                method: request.method.toLowerCase(),
                url,
                headers,
                data,
                validateStatus: () => true,
                maxRedirects: config.followRedirects ? 5 : 0,
                timeout: config.timeout
            };

            const response = await axios(axiosConfig);
            const endTime = Date.now();

            const apiResponse: ApiResponse = {
                status: response.status,
                statusText: response.statusText,
                headers: response.headers as Record<string, string>,
                data: response.data,
                time: endTime - startTime,
                size: JSON.stringify(response.data).length
            };

            return apiResponse;

        } catch (error) {
            const endTime = Date.now();
            const axiosError = error as AxiosError;
            
            throw {
                message: axiosError.message,
                code: axiosError.code,
                time: endTime - startTime
            };
        }
    };
}
