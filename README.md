# Migo mobile

An unsolicited, independent concept for a native Migo app on Android and iOS,
built with React Native and Expo. Migo did not commission, review or approve it.
Every server call is mocked: see [what's real and what's mocked](docs/REAL-VS-MOCKED.md).
The [accessibility report](docs/ACCESSIBILITY.md) covers the audit and the
end-to-end results.

## Local setup

```bash
pnpm install
pnpm typecheck && pnpm lint && pnpm test   # should be green before you start
```

### Android needs JDK 17 — not Android Studio's bundled JDK

**React Native 0.86** builds Android against **JDK 17** — see
[Set Up Your Environment](https://reactnative.dev/docs/set-up-your-environment).
This is a React Native requirement, not an Expo one — the Expo SDK 57 docs do
not specify a JDK version. Android Studio ships a newer JBR (25 at the time of
writing), and if that is the JDK Gradle picks up, the build fails part-way
through the native compile with a message that does not mention Java at all:

```text
Execution failed for task ':react-native-worklets:configureCMakeDebug[arm64-v8a]'.
> WARNING: A restricted method in java.lang.System has been called
```

That is JDK 25 refusing a restricted native call, not a problem with worklets.
Adding `--enable-native-access=ALL-UNNAMED` to `org.gradle.jvmargs` does **not**
fix it — the CMake configure step runs outside the Gradle daemon's JVM.

Install JDK 17 and point `JAVA_HOME` at it:

```bash
brew install openjdk@17
```

Homebrew keeps `openjdk@17` keg-only, so it is deliberately *not* on `PATH` and
`/usr/libexec/java_home` will not find it. Export it explicitly:

```bash
export JAVA_HOME="/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home"
export ANDROID_HOME="$HOME/Library/Android/sdk"
export PATH="$JAVA_HOME/bin:$ANDROID_HOME/platform-tools:$PATH"
```

Worth putting in your shell profile. If Gradle has already run under the wrong
JDK, stop the stale daemons first — they do not pick up a changed `JAVA_HOME`:

```bash
cd android && ./gradlew --stop
```

Then:

```bash
pnpm android    # or: pnpm ios
```

### Running the Android emulator

Start **one** emulator. A second instance of the same AVD fails outright, and —
more confusingly — an emulator that starts while another holds the default port
falls back to a non-standard, IPv6-only port. `adb` only auto-scans IPv4
`127.0.0.1:5554-5584`, so that emulator is invisible to `adb devices` while
appearing perfectly healthy on screen.

```bash
$ANDROID_HOME/emulator/emulator -list-avds
$ANDROID_HOME/emulator/emulator -avd <name> &
adb devices     # expect: emulator-5554  device
```

If `adb devices` is empty but an emulator is clearly running, it is almost
certainly a duplicate instance rather than a broken emulator — check with
`ps aux | grep qemu-system` before killing anything.
