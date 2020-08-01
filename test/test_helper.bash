load "$(pwd)/node_modules/bats-support/load.bash"
load "$(pwd)/node_modules/bats-assert/load.bash"
load "$(pwd)/node_modules/bats-file/load.bash"

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
