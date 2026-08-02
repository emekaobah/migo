# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

> The sections below "Local setup" are still the `create-expo-app` template text
> and have not been rewritten for this project — note in particular that they say
> `npm`, while this repo uses **pnpm**.

## Local setup

```bash
pnpm install
pnpm typecheck && pnpm lint && pnpm test   # should be green before you start
```

### Android needs JDK 17 — not Android Studio's bundled JDK

Expo SDK 57 / React Native 0.86 build against **JDK 17**. Android Studio ships a
newer JBR (25 at the time of writing), and if that is the JDK Gradle picks up,
the build fails part-way through the native compile with a message that does not
mention Java at all:

```
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

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

### Other setup steps

- To set up ESLint for linting, run `npx expo lint`, or follow our guide on ["Using ESLint and Prettier"](https://docs.expo.dev/guides/using-eslint/)
- If you'd like to set up unit testing, follow our guide on ["Unit Testing with Jest"](https://docs.expo.dev/develop/unit-testing/)
- Learn more about the TypeScript setup in this template in our guide on ["Using TypeScript"](https://docs.expo.dev/guides/typescript/)

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
