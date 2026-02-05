-- Migration to add search_embeddings RPC function
-- This function allows semantic search over the embeddings table

create or replace function search_embeddings(
  query_embedding vector(768),
  match_threshold float,
  match_count int,
  filter_user_id uuid,
  filter_entity_types text[]
)
returns table (
  entity_type text,
  entity_id uuid,
  content text,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    embeddings.entity_type,
    embeddings.entity_id,
    embeddings.content,
    1 - (embeddings.embedding <=> query_embedding) as similarity
  from
    embeddings
  where
    1 - (embeddings.embedding <=> query_embedding) > match_threshold
    and (filter_user_id is null or embeddings.user_id = filter_user_id)
    and (filter_entity_types is null or embeddings.entity_type = any(filter_entity_types))
  order by
    embeddings.embedding <=> query_embedding
  limit match_count;
end;
$$;
