import { z } from 'zod';
import { insertUserSchema, insertSettingsSchema } from './schema';

export const errorSchemas = {
  validation: z.object({ message: z.string(), field: z.string().optional() }),
  notFound: z.object({ message: z.string() }),
  unauthorized: z.object({ message: z.string() }),
};

export const api = {
  auth: {
    login: {
      method: 'POST' as const,
      path: '/api/auth/login' as const,
      // `role` is optional — when provided, server validates the account belongs to that role
      input: z.object({
        email: z.string().email(),
        password: z.string(),
        role: z.enum(['admin', 'student']).optional(),
      }),
      responses: {
        200: z.object({ token: z.string(), user: z.any() }),
        401: errorSchemas.unauthorized
      }
    },
    me: {
      method: 'GET' as const,
      path: '/api/auth/me' as const,
      responses: {
        200: z.any(),
        401: errorSchemas.unauthorized
      }
    }
  },
  admin: {
    students: {
      create: {
        method: 'POST' as const,
        path: '/api/admin/students' as const,
        input: z.object({
          id: z.string().min(1, "Register number is required"),
          name: z.string(),
          email: z.string().email(),
          password: z.string(),
          faceEncoding: z.array(z.number())
        }),
        responses: { 201: z.any(), 400: errorSchemas.validation }
      },
      list: {
        method: 'GET' as const,
        path: '/api/admin/students' as const,
        responses: { 200: z.array(z.any()) }
      },
      delete: {
        method: 'DELETE' as const,
        path: '/api/admin/students/:id' as const,
        responses: { 204: z.void() }
      }
    },
    settings: {
      get: {
        method: 'GET' as const,
        path: '/api/admin/settings' as const,
        responses: { 200: z.any() }
      },
      update: {
        method: 'PUT' as const,
        path: '/api/admin/settings' as const,
        input: z.object({
          allowedLatitude: z.number(),
          allowedLongitude: z.number(),
          allowedRadius: z.number() // in meters
        }),
        responses: { 200: z.any() }
      }
    },
    attendance: {
      list: {
        method: 'GET' as const,
        path: '/api/admin/attendance' as const,
        responses: { 200: z.array(z.any()) }
      },
      pending: {
        method: 'GET' as const,
        path: '/api/admin/attendance/pending' as const,
        responses: { 200: z.array(z.any()) }
      },
      approve: {
        method: 'PUT' as const,
        path: '/api/admin/attendance/:id/approve' as const,
        responses: { 200: z.object({ message: z.string() }) }
      },
      reject: {
        method: 'PUT' as const,
        path: '/api/admin/attendance/:id/reject' as const,
        responses: { 200: z.object({ message: z.string() }) }
      },
      delete: {
        method: 'DELETE' as const,
        path: '/api/admin/attendance/:id' as const,
        responses: { 204: z.void() }
      }
    },
    periods: {
      list: {
        method: 'GET' as const,
        path: '/api/admin/periods' as const,
        responses: { 200: z.array(z.any()) }
      },
      create: {
        method: 'POST' as const,
        path: '/api/admin/periods' as const,
        input: z.object({
          periodNumber: z.number(),
          label: z.string(),
          startTime: z.string(),
          endTime: z.string(),
          isActive: z.enum(["true", "false"]).optional(),
        }),
        responses: { 201: z.any(), 400: errorSchemas.validation }
      },
      update: {
        method: 'PUT' as const,
        path: '/api/admin/periods/:id' as const,
        input: z.object({
          periodNumber: z.number().optional(),
          label: z.string().optional(),
          startTime: z.string().optional(),
          endTime: z.string().optional(),
          isActive: z.enum(["true", "false"]).optional(),
        }),
        responses: { 200: z.any(), 400: errorSchemas.validation, 404: errorSchemas.notFound }
      },
      delete: {
        method: 'DELETE' as const,
        path: '/api/admin/periods/:id' as const,
        responses: { 204: z.void() }
      }
    }
  },
  student: {
    activePeriod: {
      get: {
        method: 'GET' as const,
        path: '/api/student/active-period' as const,
        responses: { 200: z.object({ period: z.any() }) }
      }
    },
    attendance: {
      mark: {
        method: 'POST' as const,
        path: '/api/student/attendance' as const,
        input: z.object({
          latitude: z.number(),
          longitude: z.number(),
          faceEncoding: z.array(z.number()), // Face encoding from webcam
          periodId: z.number().optional(),
        }),
        responses: {
          200: z.object({ message: z.string(), status: z.string(), distance: z.number(), period: z.any().optional() }),
          400: errorSchemas.validation
        }
      },
      history: {
        method: 'GET' as const,
        path: '/api/student/attendance' as const,
        responses: { 200: z.array(z.any()) }
      }
    }
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url = url.replace(`:${key}`, String(value));
    });
  }
  return url;
}
