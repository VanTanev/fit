#!/usr/bin/env bats
# vi: ft=bash

load "test_helper"

setup() {
    EXE="$(pwd)/bin/fit"
    TEST_TEMP_DIR="$(temp_make)"
    BATSLIB_FILE_PATH_REM="#${TEST_TEMP_DIR}"
    echo $BATSLIB_TEMP_PRESERVE_ON_FAILURE
    BATSLIB_FILE_PATH_ADD='<temp>'
    rm -rf "$TEST_TEMP_DIR"
    mkdir -p "$TEST_TEMP_DIR"
    cd "$TEST_TEMP_DIR"
}

teardown() {
    temp_del "$TEST_TEMP_DIR"
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
    skip "executing this requires sudo, so we don't run it by default"
    DIR="init-private"
    mkdir "$DIR"
    sudo chown root "$DIR"
    run $EXE init "$DIR"
    assert_failure
}
