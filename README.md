# Army Rush — Android oynanabilir prototip

Army Rush ana geliştirme dokümanını temel alan, dikey ekranda oynanabilen ilk prototiptir. Bu sürüm **tamamlanmış ticari oyun değildir**. Hedef, telefonda oynanabilir çekirdek döngüyü ve Android paketleme altyapısını sağlamaktır.

## Şu an neler var?
- Dikey mobil oyun ekranı ve parmakla sağ/sol sürükleme.
- Otomatik ilerleme hissi veren perspektif parkur.
- `+N` ve `×N` asker kapıları; birlik sayısı gerçek oyun durumuna uygulanır.
- Engeller, asker kaybı, otomatik atışlar ve basit boss sağlık sistemi.
- Zafer/yenilgi ekranı, bölüm numarası ve jeton ödülü.
- Yerel kayıt: jeton, bölüm, başlangıç askeri yükseltmesi ve saldırı yükseltmesi.
- Mobil arayüz, duraklatma, temel parçacık efektleri.
- GitHub Actions ile web derlemesi ve test; Android derleme iş akışı.
- Capacitor Android kabuğu.

## APK indir

GitHub Actions her `main` push'unda debug APK üretir:

- **Releases:** [Son APK](../../releases/latest) → `ArmyRush-debug.apk`
- **Repo içinde:** [`apk/ArmyRush-debug.apk`](apk/ArmyRush-debug.apk)
- Elle başlatmak için: *Actions → Build Android APK → Run workflow*

Telefonda kurarken "bilinmeyen kaynaklardan yüklemeye izin ver" açılmalıdır. Bu bir debug APK'dır (Play Store için imzalı AAB ayrıca gerekir).

## Geliştirme ortamı
- Node.js 20+
- Android Studio ve uyumlu Android SDK
- JDK 17 (Capacitor/Android Gradle gereksinimlerine göre)

## Web'de çalıştırma
```bash
npm install
npm test
npm start
```
Vite adresini tarayıcıda açın. Üretim web dosyaları `npm run build` ile `dist/` içine çıkar.

## Android projesi ve APK
```bash
npm install
npm run build
npx cap add android
npx cap sync android
npx cap open android
```
Android Studio içinde Gradle senkronizasyonunu tamamlayıp `Build > Build Bundle(s) / APK(s) > Build APK(s)` seçin. APK genellikle `android/app/build/outputs/apk/debug/` altına çıkar.

AAB için Android Studio'da `Build > Generate Signed Bundle / APK > Android App Bundle` yolunu izleyin. Yayın için kendi imzalama anahtarınız ve Google Play ayarları gerekir. Anahtarları depoya koymayın.

## GitHub'a yükleme
1. ZIP'i açın ve klasör içeriğini yeni GitHub deposuna yükleyin.
2. `npm install` ve `npm test` çalıştırın.
3. Android Studio'da yukarıdaki adımlarla Android projesini üretin.
4. `.github/workflows/android.yml` iş akışı, Android klasörü depoya eklendikten sonra APK debug çıktısını üretmeyi dener.

## Dürüst durum raporu

### Uygulandı
- Oynanabilir prototip ve temel oyun döngüsü.
- Mobil sürükleme kontrolü, kapılar, engeller, düşman/boss prototipi.
- Yerel yükseltmeler ve ilerleme kaydı.
- Test dosyaları, README ve GitHub Actions taslakları.
- Capacitor yapılandırması.

### Test edildi
- `npm test` ile saf oyun matematiği testleri.
- `npm run build` ile web paketlemesi (GitHub Actions üzerinde de çalıştırılır).

### Henüz yapılmadı
- Gerçek GLB/glTF 3D asker ve ortam modelleri; bu sürüm stilize 2D canvas prototipidir.
- 30 tasarlanmış bölüm, sonsuz mod, asker sınıfları, gerçek AI ve çok aşamalı boss saldırıları.
- Ses paketi, günlük ödüller, görev/başarım sistemi, kozmetik koleksiyonu.
- Gerçek reklam SDK'sı, ödüllü reklam doğrulaması, Google Play Billing ve backend.
- Bulut kayıtları, analitik ve cihazlarda performans/erişilebilirlik testleri.

### Harici kurulum gerekiyor
- Android Studio, Android SDK ve JDK.
- Android platformunun `npx cap add android` ile üretilmesi (android/ klasörü bu kaynak ZIP'inde önceden üretilmiş değildir).
- Google Play hesabı, imzalama anahtarı ve mağaza bilgileri.
- Reklam, satın alma ve sunucu hizmetleri kullanılacaksa sağlayıcı hesapları ve güvenli backend.

## Önemli
Bu ZIP kaynak kodudur; içinde önceden derlenmiş APK/AAB bulunmaz. APK/AAB'nin başarıyla üretildiği veya gerçek Android cihazda test edildiği iddia edilmez. Üretim yayınından önce cihaz testleri ve eksik sistemlerin geliştirilmesi gerekir.
