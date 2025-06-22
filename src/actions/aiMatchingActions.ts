// src/actions/aiMatchingActions.ts
'use server';

import { query } from '@/lib/db';
import type { AIMatch } from '@/lib/types';
import { randomUUID } from 'crypto';
import { revalidatePath } from 'next/cache';

function mapDbRowToAIMatch(row: any): AIMatch {
  return {
    id: row.id,
    property_id: row.property_id,
    request_id: row.request_id,
    match_score: Number(row.match_score),
    reason: row.reason,
    last_calculated_at: new Date(row.last_calculated_at).toISOString(),
    // These will be joined in the get actions
    property_title: row.property_title,
    property_slug: row.property_slug,
    request_title: row.request_title,
    request_slug: row.request_slug,
  };
}

export async function saveOrUpdateAiMatchAction(
  propertyId: string,
  requestId: string,
  matchScore: number,
  reason: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const matchId = randomUUID();
    const sql = `
      INSERT INTO ai_matches (id, property_id, request_id, match_score, reason, last_calculated_at)
      VALUES (?, ?, ?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE
        match_score = VALUES(match_score),
        reason = VALUES(reason),
        last_calculated_at = NOW()
    `;
    await query(sql, [matchId, propertyId, requestId, matchScore, reason]);
    // Revalidate the matching page when a match is updated/created
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
    const sql = `
      SELECT 
        m.*,
        r.title as request_title,
        r.slug as request_slug
      FROM ai_matches m
      JOIN property_requests r ON m.request_id = r.id
      WHERE m.property_id = ?
      ORDER BY m.match_score DESC
    `;
    const rows = await query(sql, [propertyId]);
    return rows.map(mapDbRowToAIMatch);
  } catch (error: any) {
    console.error(`[AIMatchingAction] Error fetching matches for property ${propertyId}:`, error);
    return [];
  }
}

export async function getMatchesForRequestAction(requestId: string): Promise<AIMatch[]> {
   if (!requestId) return [];
  try {
    const sql = `
      SELECT 
        m.*,
        p.title as property_title,
        p.slug as property_slug
      FROM ai_matches m
      JOIN properties p ON m.property_id = p.id
      WHERE m.request_id = ?
      ORDER BY m.match_score DESC
    `;
    const rows = await query(sql, [requestId]);
    return rows.map(mapDbRowToAIMatch);
  } catch (error: any) {
    console.error(`[AIMatchingAction] Error fetching matches for request ${requestId}:`, error);
    return [];
  }
}
