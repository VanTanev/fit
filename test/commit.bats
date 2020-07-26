#!/usr/bin/env bats
# vi: ft=bash

load "test_helper"

setup() {
    EXE="timeout 2s $(pwd)/bin/fit"
    TEST_TEMP_DIR="$(temp_make)"
    BATSLIB_FILE_PATH_REM="#${TEST_TEMP_DIR}"
    BATSLIB_FILE_PATH_ADD='<temp>'
    rm -rf "$TEST_TEMP_DIR"
    mkdir -p "$TEST_TEMP_DIR"
    cd "$TEST_TEMP_DIR"
    $EXE init
}
teardown() {
    temp_del "$TEST_TEMP_DIR"
}

@test "root commit" {
  mkdir node_modules
  echo "hello" > hello.txt

  output="$(echo "commit message" | $EXE commit)"

  assert_output --regexp '^\[\(root-commit\) .* commit message$'
  # object for hello.txt
  assert_file_exist .git/objects/ce/013625030ba8dba906f756967f9e9ca394464a
  # object for the tree
  assert_file_exist .git/objects/aa/a96ced2d9a1c8e72c56b253a0e2fe78393feb7
  # HEAD that contains a commit
  assert_file_exist .git/HEAD
}

@test "second commit" {
  echo "hello" > hello.txt
  echo "commit message" | $EXE commit

  echo "world" > world.txt
  output="$(echo "second commit message" | $EXE commit)"

  assert_output --regexp '^\[.*\] second commit message$'
  # object for hello.txt
  assert_file_exist .git/objects/ce/013625030ba8dba906f756967f9e9ca394464a
  # object for world.txt
  assert_file_exist .git/objects/cc/628ccd10742baea8241c5924df992b5c019f71
  # object for tree
  assert_file_exist .git/objects/88/e38705fdbd3608cddbe904b67c731f3234c45b
}

@test "commit executable" {
  echo "hello" > hello.txt
  chmod +x hello.txt

  echo "commit message" | $EXE commit

  # object for hello.txt
  assert_file_exist .git/objects/ce/013625030ba8dba906f756967f9e9ca394464a
  # object for the tree
  assert_file_exist .git/objects/98/fdf9811d717ff3732a85097d50ccacd67d941d
}

@test "commit nested" {
  echo "hello" > hello.txt
  mkdir -p a/b/c/e
  echo "world" > a/b/c/e/world.txt

  echo "commit message" | $EXE commit

  # object for hello.txt
  assert_file_exist .git/objects/ce/013625030ba8dba906f756967f9e9ca394464a
  # object for world.txt
  assert_file_exist .git/objects/cc/628ccd10742baea8241c5924df992b5c019f71
  # object for the tree
  assert_file_exist .git/objects/19/075f6703746d81a3329bca02c4b56ea3b1b66e
}
