import { db } from "@/lib/db";
import { properties, users, roles, plans, groups } from "@/lib/db/schema";
import { and, asc, desc, eq, gte, like, lte, or, sql, count } from "drizzle-orm";
import type { PropertyListing, PropertyType, ListingCategory, OrientationType } from "@/lib/types";

// NOTE: This file contains direct data access functions.
// It does NOT use 'use server' and its functions should be called
// from Server Components or other server-side logic (e.g. API routes, other data functions).

function mapDbRowToPropertyListing(row: any): PropertyListing {
  const p = row.properties;
  const author = row.users;
  const authorRole = row.roles;
  const authorPlan = row.plans;
  const authorGroup = row.groups;
  
  const authorPlanName = authorPlan?.name;
  const authorIsBroker = authorRole?.id === 'broker';

  return {
    id: p.id,
    pub_id: p.publicationCode,
    user_id: p.userId,
    source: p.source,
    title: p.title,
    slug: p.slug,
    description: p.description,
    propertyType: p.propertyType,
    category: p.category,
    price: Number(p.price),
    currency: p.currency,
    address: p.address,
    city: p.city,
    region: p.region,
    country: p.country,
    bedrooms: Number(p.bedrooms),
    bathrooms: Number(p.bathrooms),
    totalAreaSqMeters: Number(p.totalAreaSqMeters),
    usefulAreaSqMeters: p.usefulAreaSqMeters !== null ? Number(p.usefulAreaSqMeters) : null,
    parkingSpaces: p.parkingSpaces !== null ? Number(p.parkingSpaces) : 0,
    petsAllowed: Boolean(p.petsAllowed),
    furnished: Boolean(p.furnished),
    commercialUseAllowed: Boolean(p.commercialUseAllowed),
    hasStorage: Boolean(p.hasStorage),
    orientation: p.orientation as OrientationType | null,
    images: Array.isArray(p.images) ? p.images : [], 
    features: Array.isArray(p.features) ? p.features : [],
    upvotes: Number(p.upvotes),
    commentsCount: Number(p.commentsCount),
    views_count: Number(p.viewsCount),
    inquiries_count: Number(p.inquiriesCount),
    isActive: Boolean(p.isActive),
    createdAt: new Date(p.createdAt).toISOString(),
    updatedAt: new Date(p.updatedAt).toISOString(),
    author: author ? {
      id: author.id, 
      name: author.name,
      avatarUrl: author.avatarUrl || undefined,
      email: author.email, 
      phone_number: author.phoneNumber, 
      role_id: author.roleId || '',
      role_name: authorRole?.name || undefined,
      plan_id: author.planId,
      plan_name: authorPlanName,
      plan_is_pro_or_premium: authorIsBroker && (authorPlanName?.toLowerCase().includes('pro') || authorPlanName?.toLowerCase().includes('premium')),
      plan_allows_contact_view: !!authorPlan?.can_view_contact_data,
      plan_is_premium_broker: authorIsBroker && authorPlanName?.toLowerCase().includes('premium'),
      plan_automated_alerts_enabled: !!authorPlan?.automated_alerts_enabled,
      plan_advanced_dashboard_access: !!authorPlan?.advanced_dashboard_access,
      group_name: authorGroup?.name,
      group_avatar_url: authorGroup?.avatarUrl,
      group_badge_type: authorGroup?.postBadgeType,
    } : undefined,
  };
}

export interface GetPropertiesOptions {
  includeInactive?: boolean;
  limit?: number;
  offset?: number;
  searchTerm?: string;
  propertyType?: PropertyType;
  category?: ListingCategory;
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  minBedrooms?: number;
  minBathrooms?: number;
  orderBy?: 'createdAt_desc' | 'price_asc' | 'price_desc' | 'popularity_desc' | 'random';
}

export async function getProperties(options: GetPropertiesOptions = {}): Promise<PropertyListing[]> {
  // IMPORTANTE: Forzar includeInactive a true para mostrar todas las propiedades
  // Esto es temporal para depuración
  const {
    includeInactive = true,
    limit,
    offset = 0,
    searchTerm,
    propertyType,
    category,
    city,
    minPrice,
    maxPrice,
    minBedrooms,
    minBathrooms,
    orderBy = 'createdAt_desc'
  } = options;

  console.log('[DEBUG] getProperties options:', JSON.stringify(options));

  const conditions = [];
  // Comentamos temporalmente este filtro para mostrar todas las propiedades
  // if (!includeInactive) {
  //   conditions.push(eq(properties.isActive, true));
  // }
  
  if (searchTerm) {
    const searchTermParam = `%${searchTerm}%`;
    conditions.push(or(
      like(properties.title, searchTermParam),
      like(properties.description, searchTermParam),
      like(properties.address, searchTermParam),
      like(properties.city, searchTermParam),
      like(properties.region, searchTermParam)
    ));
  }
  if (propertyType) {
    conditions.push(eq(properties.propertyType, propertyType));
  }
  if (category) {
    conditions.push(eq(properties.category, category));
  }
  if (city) {
    conditions.push(eq(properties.city, city));
  }
  if (minPrice !== undefined) {
    conditions.push(gte(properties.price, minPrice.toString()));
  }
  if (maxPrice !== undefined) {
    conditions.push(lte(properties.price, maxPrice.toString()));
  }
  if (minBedrooms !== undefined) {
    conditions.push(gte(properties.bedrooms, minBedrooms));
  }
  if (minBathrooms !== undefined) {
    conditions.push(gte(properties.bathrooms, minBathrooms));
  }

  let orderByClause;
  switch (orderBy) {
    case 'price_asc':
      orderByClause = asc(properties.price);
      break;
    case 'price_desc':
      orderByClause = desc(properties.price);
      break;
    case 'popularity_desc':
      orderByClause = [desc(properties.viewsCount), desc(properties.upvotes)];
      break;
    case 'random':
      orderByClause = sql`RAND()`;
      break;
    case 'createdAt_desc':
    default:
      orderByClause = desc(properties.createdAt);
      break;
  }

  try {
    const rows = await db.select({
        properties: properties,
        users: users,
        roles: roles,
        plans: plans,
        groups: groups,
      }).from(properties)
      .leftJoin(users, eq(properties.userId, users.id))
      .leftJoin(roles, eq(users.roleId, roles.id))
      .leftJoin(plans, eq(users.planId, plans.id))
      .leftJoin(groups, eq(users.primaryGroupId, groups.id))
      .where(and(...conditions))
      .orderBy(Array.isArray(orderByClause) ? orderByClause : [orderByClause])
      .limit(limit || 50) // Aumentamos el límite para ver más propiedades
      .offset(offset);
      
    console.log(`[DEBUG] getProperties found ${rows.length} properties`);
    if (rows.length > 0) {
      console.log('[DEBUG] First property:', JSON.stringify({
        id: rows[0].properties.id,
        title: rows[0].properties.title,
        isActive: rows[0].properties.isActive,
        createdAt: rows[0].properties.createdAt,
        userId: rows[0].properties.userId
      }));
    }
    
    const mappedRows = rows.map(row => mapDbRowToPropertyListing(row));
    return mappedRows;

  } catch (error: any) {
    console.error(`[DB_ERROR] Failed to get properties:`, error);
    return [];
  }
}

export async function getPropertiesCount(activeOnly: boolean = false): Promise<number> {
  const conditions = [];
  if (activeOnly) {
    conditions.push(eq(properties.isActive, true));
  }
  
  try {
    const result = await db.select({ count: count() }).from(properties).where(and(...conditions));
    console.log('[DEBUG] getPropertiesCount:', result[0].count);
    return result[0].count;
  } catch (error) {
    console.error('Failed to get properties count:', error);
    return 0;
  }
} 