import { Request, Response, NextFunction } from 'express';

// Load node name and UUID from environment variables
const NODE_NAME = process.env.NODE_NAME || 'node';
const NODE_UUID = process.env.NODE_UUID || 'node_uuid';

// Middleware to attach headers to every response
export function addNodeHeaders(_: Request, res: Response, next: NextFunction) {
    res.setHeader('origin-node-uuid', NODE_UUID);
    res.setHeader('origin-node-name', NODE_NAME);

    next();
}
