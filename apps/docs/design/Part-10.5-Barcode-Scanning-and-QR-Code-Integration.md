# Inventory App Design Document - Part 10.5: Barcode Scanning and QR Code Integration

## 10.5 Barcode Scanning and QR Code Integration

### Overview
Implement barcode and QR code scanning to streamline item entry and lookup.

### Why
Scanning reduces manual errors in retail and warehousing workflows, improving efficiency.

### Implementation
- **Backend (Express.js)**:
  - Ensure `sku` is searchable:
    ```javascript
    const itemSchema = new mongoose.Schema({
      sku: { type: String, unique: true, sparse: true, index: true }
    });
    router.get('/by-sku', async (req, res, next) => {
      try {
        const { sku } = req.query;
        const item = await Item.findOne({ sku });
        if (!item) return res.status(404).json({ error: 'Item not found' });
        res.json(item);
      } catch (err) { next(err); }
    });
    ```

- **Web (Vue.js)**:
  - Use `getUserMedia`:
    ```vue
    <template>
      <video ref="video" autoplay></video>
      <button @click="scan">Scan Barcode</button>
    </template>
    <script>
    import jsQR from 'jsqr';
    import { getItems } from '@/shared/api';
    export default {
      mounted() {
        navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
          .then(stream => { this.$refs.video.srcObject = stream; });
      },
      methods: {
        async scan() {
          const canvas = document.createElement('canvas');
          canvas.width = this.$refs.video.videoWidth;
          canvas.height = this.$refs.video.videoHeight;
          canvas.getContext('2d').drawImage(this.$refs.video, 0, 0);
          const imageData = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          if (code) {
            const item = await getItems(`/by-sku?sku=${code.data}`);
            this.$router.push({ name: 'EditItemModal', params: { id: item._id } });
          }
        }
      }
    };
    </script>
    ```

- **Mobile (React Native)**:
  - Use `react-native-vision-camera`:
    ```javascript
    import { Camera } from 'react-native-vision-camera';
    import { useCameraDevices } from 'react-native-vision-camera';
    import { useNavigation } from '@react-navigation/native';
    import { useState } from 'react';
    import { Text } from 'react-native';
    import { getItems } from '@/shared/api';

    export default function BarcodeScanner() {
      const devices = useCameraDevices();
      const device = devices.back;
      const navigation = useNavigation();
      const [scanning, setScanning] = useState(true);
      if (!device) return <Text>Loading...</Text>;
      return (
        <Camera
          style={{ flex: 1 }}
          device={device}
          isActive={true}
          barcodeScannerEnabled={true}
          onBarcodeScanned={async ({ barcodes }) => {
            if (!scanning || !barcodes.length) return;
            setScanning(false);
            const sku = barcodes[0].value;
            try {
              const item = await getItems(`/by-sku?sku=${sku}`);
              navigation.navigate('EditItem', { item });
            } catch (err) {
              alert('Item not found');
            }
          }}
          barcodeScannerSettings={{ barcodeTypes: ['qr', 'ean13'] }}
        />
      );
    }
    ```

- **Mobile (Swift, iOS)**:
  - Use `AVFoundation`:
    ```swift
    import AVFoundation
    class BarcodeScanner: NSObject, AVCaptureMetadataOutputObjectsDelegate {
        private let captureSession = AVCaptureSession()
        private var onScan: ((String) -> Void)?
        func startScanning(onScan: @escaping (String) -> Void) {
            self.onScan = onScan
            guard let device = AVCaptureDevice.default(for: .video),
                  let input = try? AVCaptureDeviceInput(device: device) else { return }
            captureSession.addInput(input)
            let output = AVCaptureMetadataOutput()
            captureSession.addOutput(output)
            output.setMetadataObjectsDelegate(self, queue: .main)
            output.metadataObjectTypes = [.qr, .ean13]
            captureSession.startRunning()
        }
        func metadataOutput(_ output: AVCaptureMetadataOutput, didOutput metadataObjects: [AVMetadataObject], from connection: AVCaptureConnection) {
            if let barcode = metadataObjects.first as? AVMetadataMachineReadableCodeObject,
               let sku = barcode.stringValue {
                onScan?(sku)
                captureSession.stopRunning()
            }
        }
    }
    ```

- **Mobile (Kotlin, Android)**:
  - Use CameraX with ML Kit:
    ```kotlin
    @Composable
    fun BarcodeScannerScreen(navController: NavController) {
        val context = LocalContext.current
        val lifecycleOwner = LocalLifecycleOwner.current
        val cameraProviderFuture = remember { ProcessCameraProvider.getInstance(context) }
        AndroidView(
            factory = { PreviewView(context).apply {
                implementationMode = PreviewView.ImplementationMode.COMPATIBLE
                scaleType = PreviewView.ScaleType.FILL_CENTER
            }},
            update = { previewView ->
                cameraProviderFuture.addListener({
                    val cameraProvider = cameraProviderFuture.get()
                    val preview = Preview.Builder().build().also { it.setSurfaceProvider(previewView.surfaceProvider) }
                    const imageAnalysis = ImageAnalysis.Builder()
                        .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
                        .build()
                        .also {
                            it.setAnalyzer(ContextCompat.getMainExecutor(context)) { imageProxy ->
                                const barcodeScanner = BarcodeScanning.getClient()
                                barcodeScanner.process(imageProxy)
                                    .addOnSuccessListener { barcodes ->
                                        barcodes.firstOrNull()?.rawValue?.let { sku ->
                                            viewModelScope.launch {
                                                const item = api.getItemBySku(sku)
                                                navController.navigate("edit/${item.id}")
                                            }
                                        }
                                        imageProxy.close()
                                    }
                            }
                        }
                    cameraProvider.bindToLifecycle(lifecycleOwner, CameraSelector.DEFAULT_BACK_CAMERA, preview, imageAnalysis)
                }, ContextCompat.getMainExecutor(context))
            }
        )
    }
    ```

### Impact
- Speeds up item entry and lookup.
- Reduces errors in workflows.
- Enhances mobile usability.

### Related Considerations
- **Offline Support**: Store scanned data locally (Part 10, Section 10.3).
- **Analytics Dashboard**: Track scanning frequency (Part 10, Section 10.6).