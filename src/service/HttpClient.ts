import axios, { AxiosInstance } from 'axios';
import Logger from './Logger';

// Load node name and UUID from environment variables
const NODE_NAME = process.env.NODE_NAME;
const NODE_UUID = process.env.NODE_UUID;  // Generate UUID if not provided

class HttpClient {
    private axiosInstance: AxiosInstance;

    constructor() {
        // Create an Axios instance with interceptors for adding headers
        this.axiosInstance = axios.create();

        this.axiosInstance.interceptors.request.use((config) => {
            config.headers['origin-node-uuid'] = NODE_UUID;
            config.headers['origin-node-name'] = NODE_NAME;

            return config;
        }, (error) => {
            Logger.error('Failed to attach headers to request:', error);
            return Promise.reject(error);
        });
    }

    // Expose the Axios instance for reuse
    public getInstance(): AxiosInstance {
        return this.axiosInstance;
    }
}

// Export a default instance of HttpClient for reuse
const httpClient = new HttpClient().getInstance();
export default httpClient;
