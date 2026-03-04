import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { query } from '@/lib/db';
import { Proposal, CreateProposalRequest } from '@/types/proposal';

const createProposalSchema = z.object({
  name: z.string().min(1).max(255),
  client_name: z.string().max(255).optional(),
  currency: z.enum(['USD', 'CNY', 'EUR', 'GBP']).default('USD'),
  notes: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    let queryText = 'SELECT * FROM proposals';
    const params: any[] = [];
    
    if (status) {
      queryText += ' WHERE status = $1';
      params.push(status);
    }
    
    queryText += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit, offset);
    
    const result = await query(queryText, params);
    
    return NextResponse.json({
      proposals: result.rows,
      total: result.rowCount,
    });
  } catch (error) {
    console.error('Error fetching proposals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch proposals' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = createProposalSchema.parse(body);
    
    const result = await query(
      `INSERT INTO proposals (name, client_name, currency, notes, status)
       VALUES ($1, $2, $3, $4, 'draft')
       RETURNING *`,
      [validated.name, validated.client_name, validated.currency, validated.notes]
    );
    
    const proposal: Proposal = result.rows[0];
    
    return NextResponse.json(proposal, { status: 201 });
  } catch (error) {
    console.error('Error creating proposal:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.issues },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create proposal' },
      { status: 500 }
    );
  }
}
