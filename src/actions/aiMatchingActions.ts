// src/actions/aiMatchingActions.ts
'use server';

import { db } from '@/lib/db';
import { aiMatches, properties, searchRequests } from '@/lib/db/schema';
import type { AIMatch } from '@/lib/types';
import { desc, eq, getTableColumns } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { revalidatePath } from 'next/cache';

function mapDbRowToAIMatch(row: any): AIMatch {
  const property_title = row.property ? row.property.title : row.property_title;
  const property_slug = row.property ? row.property.slug : row.property_slug;
  const request_title = row.request ? row.request.title : row.request_title;
  const request_slug = row.request ? row.request.slug : row.request_slug;

  return {
    id: row.id,
    property_id: row.property_id,
    request_id: row.request_id,
    match_score: Number(row.match_score),
    reason: row.reason,
    last_calculated_at: new Date(row.last_calculated_at).toISOString(),
    property_title,
    property_slug,
    request_title,
    request_slug,
  };
}

export async function saveOrUpdateAiMatchAction(
  propertyId: string,
  requestId: string,
  matchScore: number,
  reason: string
): Promise<{ success: boolean; message?: string }> {
  try {
    await db
      .insert(aiMatches)
      .values({
        id: randomUUID(),
        property_id: propertyId,
        request_id: requestId,
        match_score: matchScore,
        reason: reason,
        last_calculated_at: new Date(),
      })
      .onDuplicateKeyUpdate({
        set: {
          match_score: matchScore,
          reason: reason,
          last_calculated_at: new Date(),
        },
      });

    revalidatePath('/ai-matching');
    return { success: true, message: "Coincidencia de IA guardada." };
  } catch (error: any) {
    console.error("[AIMatchingAction] Error saving AI match:", error);
    return { success: false, message: "Error al guardar la coincidencia de IA." };
  }
}

export async function getMatchesForPropertyAction(propertyId: string): Promise<AIMatch[]> {
  if (!propertyId) return [];
  try {
    const rows = await db.query.aiMatches.findMany({
        where: eq(aiMatches.property_id, propertyId),
        with: {
            request: {
                columns: {
                    title: true,
                    slug: true,
                }
            }
        },
        orderBy: [desc(aiMatches.match_score)]
    });
    
    return rows.map(mapDbRowToAIMatch);
  } catch (error: any) {
    console.error(`[AIMatchingAction] Error fetching matches for property ${propertyId}:`, error);
    return [];
  }
}

export async function getMatchesForRequestAction(requestId: string): Promise<AIMatch[]> {
  if (!requestId) return [];
  try {
    const rows = await db.query.aiMatches.findMany({
        where: eq(aiMatches.request_id, requestId),
        with: {
            property: {
                columns: {
                    title: true,
                    slug: true,
                }
            }
        },
        orderBy: [desc(aiMatches.match_score)]
    });
    
    return rows.map(mapDbRowToAIMatch);
  } catch (error: any) {
    console.error(`[AIMatchingAction] Error fetching matches for request ${requestId}:`, error);
    return [];
  }
}
