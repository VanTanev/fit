#!/usr/bin/env bats
# vi: ft=bash
load "$(pwd)/node_modules/bats-support/load.bash"
load "$(pwd)/node_modules/bats-assert/load.bash"
load "$(pwd)/node_modules/bats-file/load.bash"

setup() {
    EXE="timeout 2s $(pwd)/bin/fptsjit"
    TEST_TEMP_DIR="test/fixtures"
    rm -rf "$TEST_TEMP_DIR"
    mkdir -p "$TEST_TEMP_DIR"
    cd "$TEST_TEMP_DIR"
    DIR="commit"
    mkdir -p "$DIR"
    cd "$DIR"
    $EXE init
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
  mkdir node_modules
  echo "hello" > hello.txt
  echo "commit message" | $EXE commit

  echo "word" > world.txt
  output="$(echo "second commit message" | $EXE commit)"

  assert_output --regexp '^\[.*\] second commit message$'
  # object for world.txt
  assert_file_exist .git/objects/4f/5b27863af382ba25fbd34e92dbb1f1e062c231
  # object for tree
  assert_file_exist .git/objects/23/48d20078cb4814bc60469b1238ac48ab6a0465
}
