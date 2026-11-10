// 로그인 사용자의 profiles / bookmarks 테이블 읽기·쓰기 (supabase/schema.sql).
// RLS 정책상 본인 행(auth.uid() = id / user_id)만 접근할 수 있습니다.
import { supabase } from './supabase.js'

// ── 프로필 ──
// 화면(eligibility.js)은 { grade, major, region, age, hasTeam, interests } 형태, DB는 team 'TEAM'|'SOLO'|null

function toRow(profile) {
  return {
    grade: profile.grade === '' ? null : profile.grade,
    major: profile.major || null,
    region: profile.region || null,
    age: profile.age === '' ? null : profile.age,
    team: profile.hasTeam === true ? 'TEAM' : profile.hasTeam === false ? 'SOLO' : null,
    interests: profile.interests ?? [],
  }
}

function fromRow(row) {
  return {
    grade: row.grade ?? '',
    major: row.major ?? '',
    region: row.region ?? '',
    age: row.age ?? '',
    hasTeam: row.team === 'TEAM' ? true : row.team === 'SOLO' ? false : null,
    interests: row.interests ?? [],
  }
}

export async function fetchProfile(userId) {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
  if (error) throw error
  return data ? fromRow(data) : null
}

export async function upsertProfile(userId, profile) {
  const { error } = await supabase
    .from('profiles')
    .upsert({ id: userId, ...toRow(profile), updated_at: new Date().toISOString() })
  if (error) throw error
}

export async function deleteProfile(userId) {
  const { error } = await supabase.from('profiles').delete().eq('id', userId)
  if (error) throw error
}

// ── 관심 프로그램 ──

export async function fetchBookmarks(userId) {
  const { data, error } = await supabase
    .from('bookmarks')
    .select('program_id')
    .eq('user_id', userId)
    .order('created_at')
  if (error) throw error
  return data.map((row) => row.program_id)
}

export async function addBookmark(userId, programId) {
  const { error } = await supabase
    .from('bookmarks')
    .upsert({ user_id: userId, program_id: programId }, { ignoreDuplicates: true })
  if (error) throw error
}

export async function removeBookmark(userId, programId) {
  const { error } = await supabase.from('bookmarks').delete().eq('user_id', userId).eq('program_id', programId)
  if (error) throw error
}

// 비로그인 때 저장해둔 북마크를 계정으로 옮김. DB에 없는 프로그램(예전 목데이터 id 등)은 건너뜀
export async function importBookmarks(userId, programIds) {
  await Promise.allSettled(programIds.map((id) => addBookmark(userId, id)))
}
