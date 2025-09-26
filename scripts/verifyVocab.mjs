#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// 검증할 파일들
const VOCAB_FILES = [
  'public/data/vocab/allergies.ko.json',
  'public/data/vocab/food_dislikes.ko.json'
];

let exitCode = 0;

console.log('🔍 Vocab 파일 검증 시작...\n');

/**
 * 파일 존재 여부 확인
 */
function checkFileExists(filePath) {
  const fullPath = path.join(projectRoot, filePath);
  if (!fs.existsSync(fullPath)) {
    console.error(`❌ 파일이 존재하지 않음: ${filePath}`);
    return false;
  }
  console.log(`✅ 파일 존재: ${filePath}`);
  return true;
}

/**
 * JSON 파싱 및 스키마 검증
 */
function validateVocabFile(filePath) {
  const fullPath = path.join(projectRoot, filePath);

  try {
    const content = fs.readFileSync(fullPath, 'utf-8');
    const data = JSON.parse(content);

    console.log(`📋 ${path.basename(filePath)} 검증 중...`);

    if (typeof data !== 'object' || data === null) {
      throw new Error('루트 요소가 객체가 아님');
    }

    const keys = Object.keys(data);
    if (keys.length === 0) {
      throw new Error('빈 객체임');
    }

    console.log(`   📊 총 ${keys.length}개 엔트리 발견`);

    // 모든 synonym을 수집하여 중복 검사
    const allSynonyms = new Set();
    const duplicates = new Set();

    for (const [key, entry] of Object.entries(data)) {
      // 스키마 검증
      if (!entry.label || typeof entry.label !== 'string') {
        throw new Error(`엔트리 "${key}": label이 없거나 문자열이 아님`);
      }

      if (entry.label.trim() === '') {
        throw new Error(`엔트리 "${key}": label이 빈 문자열`);
      }

      if (!Array.isArray(entry.synonyms)) {
        throw new Error(`엔트리 "${key}": synonyms가 배열이 아님`);
      }

      if (entry.synonyms.length === 0) {
        throw new Error(`엔트리 "${key}": synonyms가 빈 배열`);
      }

      // synonym 중복 검사 (대소문자 무시)
      for (const synonym of entry.synonyms) {
        if (typeof synonym !== 'string') {
          throw new Error(`엔트리 "${key}": synonym이 문자열이 아님 - ${synonym}`);
        }

        if (synonym.trim() === '') {
          throw new Error(`엔트리 "${key}": 빈 synonym 발견`);
        }

        const normalizedSynonym = synonym.toLowerCase().trim();

        if (allSynonyms.has(normalizedSynonym)) {
          duplicates.add(synonym);
        } else {
          allSynonyms.add(normalizedSynonym);
        }
      }

      console.log(`   ✓ ${key}: "${entry.label}" (${entry.synonyms.length}개 동의어)`);
    }

    // 중복 synonym 보고
    if (duplicates.size > 0) {
      throw new Error(`중복된 동의어 발견: ${Array.from(duplicates).join(', ')}`);
    }

    console.log(`   🎯 총 ${allSynonyms.size}개 고유 동의어, 중복 없음\n`);

    return true;

  } catch (error) {
    console.error(`❌ ${filePath} 검증 실패: ${error.message}\n`);
    return false;
  }
}

/**
 * 메인 검증 로직
 */
function main() {
  console.log('📁 프로젝트 루트:', projectRoot);
  console.log('🎯 검증 대상:', VOCAB_FILES.join(', '));
  console.log('');

  // 1. 파일 존재 여부 확인
  for (const filePath of VOCAB_FILES) {
    if (!checkFileExists(filePath)) {
      exitCode = 1;
    }
  }

  if (exitCode !== 0) {
    console.error('\n❌ 일부 파일이 존재하지 않습니다.');
    process.exit(exitCode);
  }

  console.log('');

  // 2. 각 파일 스키마 검증
  for (const filePath of VOCAB_FILES) {
    if (!validateVocabFile(filePath)) {
      exitCode = 1;
    }
  }

  // 3. 최종 결과
  if (exitCode === 0) {
    console.log('🎉 모든 vocab 파일이 검증을 통과했습니다!');
  } else {
    console.error('💥 일부 vocab 파일이 검증에 실패했습니다.');
  }

  process.exit(exitCode);
}

main();