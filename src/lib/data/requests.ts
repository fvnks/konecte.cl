import { db } from "@/lib/db";
import { searchRequests, users, groups } from "@/lib/db/schema";
import { and, asc, desc, eq, like, or, sql, count } from "drizzle-orm";
import type { SearchRequest, User, PropertyType, ListingCategory } from "@/lib/types";

// NOTE: This file contains direct data access functions.

function mapDbRowToSearchRequest(row: any): SearchRequest {
  const sr = row.property_requests;
  const authorData = row.users;
  const groupData = row.groups;

  const desiredPropertyType: PropertyType[] = [];
  if (sr.desiredPropertyTypeRent) desiredPropertyType.push('rent');
  if (sr.desiredPropertyTypeSale) desiredPropertyType.push('sale');

  const desiredCategories: ListingCategory[] = [];
  if (sr.desiredCategoryApartment) desiredCategories.push('apartment');
  if (sr.desiredCategoryHouse) desiredCategories.push('house');
  if (sr.desiredCategoryCondo) desiredCategories.push('condo');
  if (sr.desiredCategoryLand) desiredCategories.push('land');
  if (sr.desiredCategoryCommercial) desiredCategories.push('commercial');
  if (sr.desiredCategoryOther) desiredCategories.push('other');
  
  const author: User | undefined = authorData ? {
    id: authorData.id,
    name: authorData.name,
    avatarUrl: authorData.avatarUrl || undefined,
    role_id: authorData.roleId || '',
    phone_number: authorData.phoneNumber,
    primaryGroup: groupData ? {
      id: groupData.id,
      name: groupData.name,
      avatarUrl: groupData.avatarUrl,
      postBadgeType: groupData.postBadgeType,
    } : undefined,
  } : undefined;

  return {
    id: sr.id,
    pub_id: sr.publicationCode,
    user_id: sr.userId,
    source: sr.source,
    title: sr.title,
    slug: sr.slug,
    description: sr.description,
    desiredPropertyType,
    desiredCategories,
    desiredLocation: {
      city: sr.desiredLocationCity,
      region: sr.desiredLocationRegion,
      neighborhood: sr.desiredLocationNeighborhood || undefined,
    },
    minBedrooms: sr.minBedrooms !== null ? Number(sr.minBedrooms) : undefined,
    minBathrooms: sr.minBathrooms !== null ? Number(sr.minBathrooms) : undefined,
    budgetMax: sr.budgetMax !== null ? Number(sr.budgetMax) : undefined,
    open_for_broker_collaboration: Boolean(sr.openForBrokerCollaboration),
    commentsCount: Number(sr.commentsCount),
    upvotes: Number(sr.upvotes || 0),
    isActive: Boolean(sr.isActive),
    createdAt: new Date(sr.createdAt).toISOString(),
    updatedAt: new Date(sr.updatedAt).toISOString(),
    author,
  };
}


interface GetRequestsOptions {
  includeInactive?: boolean;
  userId?: string; 
  onlyOpenForCollaboration?: boolean; 
  limit?: number;
  orderBy?: 'createdAt_desc' | 'relevance' | 'random';
  searchTerm?: string;
}

export async function getRequests(options: GetRequestsOptions = {}): Promise<SearchRequest[]> {
  // IMPORTANTE: Forzar includeInactive a true para mostrar todas las solicitudes
  // Esto es temporal para depuración
  const { 
    includeInactive = true, 
    userId, 
    onlyOpenForCollaboration = false, 
    limit, 
    orderBy = 'createdAt_desc', 
    searchTerm 
  } = options;

  console.log('[DEBUG] getRequests options:', JSON.stringify(options));

  const conditions = [];
  // Comentamos temporalmente este filtro para mostrar todas las solicitudes
  // if (!includeInactive) {
  //   conditions.push(eq(searchRequests.isActive, true));
  // }
  
  if (userId) {
    conditions.push(eq(searchRequests.userId, userId));
  }
  if (onlyOpenForCollaboration) {
    conditions.push(eq(searchRequests.openForBrokerCollaboration, true));
  }
  if (searchTerm) {
    const searchTermParam = `%${searchTerm}%`;
    conditions.push(or(
      like(searchRequests.title, searchTermParam),
      like(searchRequests.description, searchTermParam),
      like(searchRequests.desiredLocationCity, searchTermParam),
      like(searchRequests.desiredLocationRegion, searchTermParam)
    ));
  }

  let orderByClause;
  if (orderBy === 'random') {
    orderByClause = sql`RAND()`;
  } else {
    orderByClause = desc(searchRequests.createdAt);
  }

  try {
    const rows = await db.select().from(searchRequests)
      .leftJoin(users, eq(searchRequests.userId, users.id))
      .leftJoin(groups, eq(users.primaryGroupId, groups.id))
      .where(and(...conditions))
      .orderBy(orderByClause)
      .limit(limit || 50); // Aumentamos el límite para ver más solicitudes
    
    console.log(`[DEBUG] getRequests found ${rows.length} requests`);
    if (rows.length > 0) {
      console.log('[DEBUG] First request:', JSON.stringify({
        id: rows[0].property_requests.id,
        title: rows[0].property_requests.title,
        isActive: rows[0].property_requests.isActive,
        createdAt: rows[0].property_requests.createdAt,
        userId: rows[0].property_requests.userId
      }));
    }
    
    return rows.map(mapDbRowToSearchRequest);

  } catch (error: any) {
    console.error(`[DB_ERROR] Failed to get requests:`, error);
    return [];
  }
}

export async function getRequestsCount(onlyActive: boolean = false): Promise<number> {
  const conditions = [];
  if (onlyActive) {
    conditions.push(eq(searchRequests.isActive, true));
  }
  
  try {
    const result = await db.select({ count: count() }).from(searchRequests).where(and(...conditions));
    console.log('[DEBUG] getRequestsCount:', result[0].count);
    return result[0].count;
  } catch (error) {
    console.error('Failed to get requests count:', error);
    return 0;
  }
} 