#!/bin/bash

set -e

echo "=========================================="
echo "public/data 폴더 정리 스크립트"
echo "=========================================="

# 현재 public/data 폴더의 모든 파일 목록 가져오기
echo "1. public/data 폴더의 모든 파일 검색 중..."
all_files=$(find public/data -type f | grep -v "^\.$" | sort)
echo "발견된 파일 수: $(echo "$all_files" | wc -l)"
echo

# src 폴더에서 fetch('/data/...') 참조 찾기
echo "2. src 폴더에서 fetch('/data/...') 참조 검색 중..."
referenced_files=()

# grep으로 fetch('/data/') 패턴 찾기
fetch_results=$(grep -r "fetch(['\"]\/data\/" ./src 2>/dev/null || true)

if [ -n "$fetch_results" ]; then
    echo "발견된 fetch 호출:"
    echo "$fetch_results"
    echo

    # 참조된 파일 경로 추출
    while IFS= read -r line; do
        if [[ $line =~ fetch\([\'\"]/data/([^\'\"]+) ]]; then
            file_path="public/data/${BASH_REMATCH[1]}"
            referenced_files+=("$file_path")
        fi
    done <<< "$fetch_results"
else
    echo "fetch('/data/...') 참조를 찾을 수 없습니다."
    echo
fi

# 중복 제거 및 정렬
IFS=$'\n' referenced_files=($(sort -u <<<"${referenced_files[*]}"))
unset IFS

echo "참조된 파일들:"
if [ ${#referenced_files[@]} -gt 0 ]; then
    for file in "${referenced_files[@]}"; do
        echo "  ✓ $file"
    done
else
    echo "  (없음)"
fi
echo

# 파일 분류 및 처리
echo "3. 파일 분류 및 처리..."
echo "=========================================="

kept_count=0
deleted_count=0

while IFS= read -r file; do
    # 빈 줄 건너뛰기
    [ -z "$file" ] && continue

    # 참조된 파일인지 확인
    is_referenced=false
    for ref_file in "${referenced_files[@]}"; do
        if [ "$file" = "$ref_file" ]; then
            is_referenced=true
            break
        fi
    done

    if [ "$is_referenced" = true ]; then
        echo "✓ 유지: $file (코드에서 참조됨)"
        ((kept_count++))
    else
        echo "✗ 삭제: $file (참조되지 않음)"
        rm -f "$file"
        ((deleted_count++))
    fi
done <<< "$all_files"

echo "=========================================="
echo "정리 완료!"
echo "유지된 파일: $kept_count"
echo "삭제된 파일: $deleted_count"
echo "=========================================="

# 빈 폴더 정리
echo "4. 빈 폴더 정리 중..."
find public/data -type d -empty -delete 2>/dev/null || true
echo "빈 폴더 정리 완료"
echo