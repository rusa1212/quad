import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useProfile } from '../context/profile.js'
import { GRADES, MAJOR_CATEGORIES, PROGRAM_TYPES, REGIONS } from '../data/constants.js'
import { usePrograms } from '../context/programs.js'
import { daysUntil } from '../utils/date.js'
import { evaluateEligibility } from '../utils/eligibility.js'
import './ProfilePage.css'

const EMPTY_FORM = { grade: '', major: '', region: '', age: '', team: '', interests: [] }

// 저장된 프로필 → 폼 값 (폼은 모든 값을 문자열로 다룸)
function toForm(profile) {
  if (!profile) return EMPTY_FORM
  return {
    grade: profile.grade === '' || profile.grade == null ? '' : String(profile.grade),
    major: profile.major ?? '',
    region: profile.region ?? '',
    age: profile.age === '' || profile.age == null ? '' : String(profile.age),
    team: profile.hasTeam === true ? 'TEAM' : profile.hasTeam === false ? 'SOLO' : '',
    interests: profile.interests ?? [],
  }
}

// 폼 값 → 프로필 (eligibility.js가 기대하는 형태)
function toProfile(form) {
  return {
    grade: form.grade ? Number(form.grade) : '',
    major: form.major,
    region: form.region,
    age: form.age ? Number(form.age) : '',
    hasTeam: form.team === 'TEAM' ? true : form.team === 'SOLO' ? false : null,
    interests: form.interests,
  }
}

function ProfilePage() {
  const { profile, saveProfile, clearProfile } = useProfile()
  const { programs } = usePrograms()
  const [form, setForm] = useState(() => toForm(profile))
  const [saved, setSaved] = useState(false)

  function update(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  function toggleInterest(type) {
    const next = form.interests.includes(type)
      ? form.interests.filter((t) => t !== type)
      : [...form.interests, type]
    update('interests', next)
  }

  function handleSubmit(e) {
    e.preventDefault()
    saveProfile(toProfile(form))
    setSaved(true)
  }

  function handleClear() {
    clearProfile()
    setForm(EMPTY_FORM)
    setSaved(false)
  }

  // 입력 중인 값 기준 미리보기 (마감 안 된 프로그램만)
  const preview = toProfile(form)
  const counts = { ELIGIBLE: 0, CHECK: 0, INELIGIBLE: 0 }
  programs
    .filter((program) => daysUntil(program.apply_end) >= 0)
    .forEach((program) => {
      counts[evaluateEligibility(program, preview).status] += 1
    })

  return (
    <section className="profile-page">
      <div className="page-header">
        <h1>내 프로필</h1>
        <p>입력한 조건으로 프로그램마다 지원 가능 여부를 판정해요. 모르는 항목은 비워두면 "확인 필요"로 표시돼요.</p>
      </div>

      <div className="profile-layout">
        <form className="panel profile-form" onSubmit={handleSubmit}>
          <div className="field-row">
            <div>
              <label className="field-label" htmlFor="grade">
                학년
              </label>
              <select id="grade" className="field-input" value={form.grade} onChange={(e) => update('grade', e.target.value)}>
                <option value="">선택 안 함</option>
                {GRADES.map((grade) => (
                  <option key={grade} value={grade}>
                    {grade}학년
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="field-label" htmlFor="age">
                나이 (만)
              </label>
              <input
                id="age"
                type="number"
                min="14"
                max="99"
                className="field-input"
                placeholder="예: 22"
                value={form.age}
                onChange={(e) => update('age', e.target.value)}
              />
            </div>
          </div>

          <div className="field-row">
            <div>
              <label className="field-label" htmlFor="major">
                전공 계열
              </label>
              <select id="major" className="field-input" value={form.major} onChange={(e) => update('major', e.target.value)}>
                <option value="">선택 안 함</option>
                {MAJOR_CATEGORIES.map((major) => (
                  <option key={major} value={major}>
                    {major}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="field-label" htmlFor="region">
                거주 지역
              </label>
              <select id="region" className="field-input" value={form.region} onChange={(e) => update('region', e.target.value)}>
                <option value="">선택 안 함</option>
                {REGIONS.map((region) => (
                  <option key={region} value={region}>
                    {region}
                  </option>
                ))}
              </select>
              <p className="field-hint">재학 중인 대학 소재지 기준인 공고도 있어요.</p>
            </div>
          </div>

          <fieldset className="field-group">
            <legend className="field-label">팀 여부</legend>
            <div className="option-row">
              {[
                ['TEAM', '팀이 있어요'],
                ['SOLO', '개인으로 지원해요'],
                ['', '아직 몰라요'],
              ].map(([value, label]) => (
                <label key={value || 'unknown'} className={form.team === value ? 'option active' : 'option'}>
                  <input type="radio" name="team" value={value} checked={form.team === value} onChange={() => update('team', value)} />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="field-group">
            <legend className="field-label">관심 분야</legend>
            <div className="option-row">
              {Object.entries(PROGRAM_TYPES).map(([value, label]) => (
                <label key={value} className={form.interests.includes(value) ? 'option active' : 'option'}>
                  <input type="checkbox" checked={form.interests.includes(value)} onChange={() => toggleInterest(value)} />
                  {label}
                </label>
              ))}
            </div>
            <p className="field-hint">목록에서 "내 조건에 맞는 것만"을 켜면 관심 분야 프로그램만 보여줘요.</p>
          </fieldset>

          <div className="form-actions">
            <button type="submit" className="button-primary">
              저장하기
            </button>
            {profile && (
              <button type="button" className="button-secondary" onClick={handleClear}>
                프로필 삭제
              </button>
            )}
          </div>

          {saved && (
            <div className="notice" role="status">
              <span>프로필을 저장했어요.</span>
              <Link to="/?fit=1">맞춤 프로그램 보기 →</Link>
            </div>
          )}
        </form>

        <aside className="panel profile-preview">
          <h2>지금 조건이라면</h2>
          <p className="panel-note">접수 중·예정인 프로그램 {counts.ELIGIBLE + counts.CHECK + counts.INELIGIBLE}개 기준</p>
          <ul className="preview-list">
            <li>
              <span className="badge badge-eligibility-ELIGIBLE">지원 가능</span>
              <strong>{counts.ELIGIBLE}개</strong>
            </li>
            <li>
              <span className="badge badge-eligibility-CHECK">확인 필요</span>
              <strong>{counts.CHECK}개</strong>
            </li>
            <li>
              <span className="badge badge-eligibility-INELIGIBLE">지원 불가</span>
              <strong>{counts.INELIGIBLE}개</strong>
            </li>
          </ul>
          <p className="panel-note">프로필은 이 브라우저에만 저장돼요.</p>
        </aside>
      </div>
    </section>
  )
}

export default ProfilePage
