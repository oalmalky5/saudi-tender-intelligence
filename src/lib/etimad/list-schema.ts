import { z } from "zod";

const nullableString = z.string().nullable();
const nullableNumber = z.number().nullable();
const nullableBoolean = z.boolean().nullable();

export const etimadListTenderSchema = z
  .object({
    tenderId: z.number().int().positive(),
    tenderIdString: z.string().min(1),
    referenceNumber: z.string().min(1),
    tenderNumber: nullableString,
    tenderName: z.string().min(1),
    agencyName: z.string().min(1),
    branchName: nullableString,
    tenderStatusId: z.number().int(),
    tenderStatusName: nullableString,
    tenderTypeId: z.number().int(),
    tenderTypeName: z.string().min(1),
    tenderActivityId: nullableNumber,
    tenderActivityName: nullableString,
    submitionDate: z.string().min(1),
    lastEnqueriesDate: nullableString,
    lastOfferPresentationDate: nullableString,
    offersOpeningDate: nullableString,
    condetionalBookletPrice: nullableNumber,
    financialFees: nullableNumber,
    invitationCost: nullableNumber,
    hasInvitations: nullableBoolean,
    isUGRP: z.boolean(),
    ugrpRfxUrl: nullableString,
  })
  .passthrough();

export const etimadListPageSchema = z
  .object({
    data: z.array(etimadListTenderSchema),
    totalCount: z.number().int().nonnegative(),
    pageSize: z.number().int().positive(),
    currentPage: z.number().int().positive(),
    queryString: nullableString,
  })
  .passthrough();

export type EtimadListTender = z.infer<typeof etimadListTenderSchema>;
export type EtimadListPage = z.infer<typeof etimadListPageSchema>;
