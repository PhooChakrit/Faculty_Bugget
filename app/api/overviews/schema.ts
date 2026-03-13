import { z } from "zod";

// Query parameters for listing overviews
export const listOverviewsQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(1000).default(100),
  department: z.string().optional(),
  search: z.string().optional(),
  status: z.string().optional(),
});

// Update field request schema
export const updateFieldSchema = z.object({
  field: z.enum([
    "_projectStatus",
    "vendorCode",
    "_costCenter",
    "_maintenanceFee",
    "_electricityFeeActual",
  ]),
  value: z.string(),
});

// Meeting record schema
export const meetingRecordSchema = z.object({
  id: z.string().optional(), // Optional for new meetings
  type: z.enum(["BOARD", "DEAN"]),
  no: z.string().min(1, "กรุณาระบุครั้งที่"),
  date: z.string().min(1, "กรุณาระบุวันที่"),
  purpose: z.string().optional(),
});

// Update meetings request schema
export const updateMeetingsSchema = z.object({
  meetings: z.array(meetingRecordSchema).min(0),
});

export type ListOverviewsQuery = z.infer<typeof listOverviewsQuerySchema>;
export type UpdateFieldInput = z.infer<typeof updateFieldSchema>;
export type MeetingRecord = z.infer<typeof meetingRecordSchema>;
export type UpdateMeetingsInput = z.infer<typeof updateMeetingsSchema>;
