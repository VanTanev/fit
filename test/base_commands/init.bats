#!/usr/bin/env bats
# vi: ft=bash
load "$(pwd)/node_modules/bats-support/load.bash"
load "$(pwd)/node_modules/bats-assert/load.bash"
load "$(pwd)/node_modules/bats-file/load.bash"

setup() {
    EXE="$(pwd)/bin/fptsjit"
    TEST_TEMP_DIR="test/fixtures"
    rm -rf "$TEST_TEMP_DIR"
    mkdir -p "$TEST_TEMP_DIR"
    cd "$TEST_TEMP_DIR"
}

@test "init without directoy" {
  DIR="init-without-dir"
  mkdir -p "$DIR"
  cd "$DIR"
  run $EXE init

  assert_dir_exist ".git/objects"
  assert_dir_exist ".git/refs"
}

@test "init with directoy" {
  DIR="init-with-dir"
  run $EXE init "$DIR"
  assert_dir_exist "$DIR/.git/objects"
  assert_dir_exist "$DIR/.git/refs"
}

@test "init on root owned dirs should not work" {
  skip
  DIR="init-private"
  mkdir "$DIR"
  sudo chown root "$DIR"
  run $EXE init "$DIR"
  assert_failure
  assert_output 'asdf'
}
