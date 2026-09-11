package com.sarallekhan;

import android.content.Context;
import android.net.wifi.WifiManager;
import android.os.PowerManager;
import android.util.Log;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.Inet4Address;
import java.net.InetAddress;
import java.net.InetSocketAddress;
import java.net.NetworkInterface;
import java.net.ServerSocket;
import java.net.Socket;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Enumeration;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicLong;
import java.util.concurrent.atomic.AtomicReference;

public class WebServerModule extends ReactContextBaseJavaModule {
    private static final String TAG = "WebServerModule";
    private final ReactApplicationContext reactContext;
    private ServerSocket serverSocket;
    private ExecutorService serverExecutor;
    private volatile boolean isRunning = false;
    private int port = 8085;
    private String primaryServerUrl = null;
    private final AtomicReference<String> notesJsonData = new AtomicReference<>("[]");
    private final AtomicLong dataVersion = new AtomicLong(System.currentTimeMillis());

    private PowerManager.WakeLock wakeLock;
    private WifiManager.WifiLock wifiLock;

    public static class NetworkEndpoint {
        public final String ip;
        public final String type; // "hotspot", "wifi", "ethernet", "fallback"
        public final String label;

        public NetworkEndpoint(String ip, String type, String label) {
            this.ip = ip;
            this.type = type;
            this.label = label;
        }
    }

    public WebServerModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
    }

    @Override
    public String getName() {
        return "WebServerModule";
    }

    @ReactMethod
    public void startServer(int requestedPort, String initialNotesJson, Promise promise) {
        try {
            if (isRunning) {
                stopServerInternal();
            }

            this.port = requestedPort > 0 ? requestedPort : 8085;
            if (initialNotesJson != null) {
                this.notesJsonData.set(initialNotesJson);
                this.dataVersion.set(System.currentTimeMillis());
            }

            acquireLocks();

            this.serverSocket = new ServerSocket();
            this.serverSocket.setReuseAddress(true);
            this.serverSocket.bind(new InetSocketAddress("0.0.0.0", this.port));
            this.isRunning = true;
            this.serverExecutor = Executors.newCachedThreadPool();

            List<NetworkEndpoint> endpoints = getAvailableEndpoints();
            String bestIp = "127.0.0.1";
            if (!endpoints.isEmpty()) {
                bestIp = endpoints.get(0).ip;
            }
            this.primaryServerUrl = "http://" + bestIp + ":" + this.port;

            // Start listening loop
            new Thread(() -> {
                while (isRunning && serverSocket != null && !serverSocket.isClosed()) {
                    try {
                        Socket clientSocket = serverSocket.accept();
                        clientSocket.setTcpNoDelay(true);
                        clientSocket.setSoTimeout(15000);
                        serverExecutor.execute(() -> handleClient(clientSocket));
                    } catch (IOException e) {
                        if (isRunning) {
                            Log.e(TAG, "Error accepting connection", e);
                        }
                    }
                }
            }).start();

            Log.i(TAG, "Web share server started at " + this.primaryServerUrl + " with " + endpoints.size() + " endpoints");

            WritableMap result = Arguments.createMap();
            result.putString("primaryUrl", this.primaryServerUrl);
            result.putInt("port", this.port);
            
            WritableArray urlsArray = Arguments.createArray();
            for (NetworkEndpoint ep : endpoints) {
                WritableMap item = Arguments.createMap();
                item.putString("ip", ep.ip);
                item.putString("url", "http://" + ep.ip + ":" + this.port);
                item.putString("type", ep.type);
                item.putString("label", ep.label);
                urlsArray.pushMap(item);
            }
            result.putArray("endpoints", urlsArray);

            promise.resolve(result);
        } catch (Exception e) {
            Log.e(TAG, "Failed to start server", e);
            releaseLocks();
            promise.reject("ERR_SERVER_START", e.getMessage());
        }
    }

    @ReactMethod
    public void stopServer(Promise promise) {
        try {
            stopServerInternal();
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("ERR_SERVER_STOP", e.getMessage());
        }
    }

    private void stopServerInternal() {
        isRunning = false;
        if (serverSocket != null) {
            try {
                serverSocket.close();
            } catch (IOException ignored) { }
            serverSocket = null;
        }
        if (serverExecutor != null) {
            serverExecutor.shutdownNow();
            serverExecutor = null;
        }
        primaryServerUrl = null;
        releaseLocks();
        Log.i(TAG, "Web share server stopped.");
    }

    private void acquireLocks() {
        try {
            PowerManager powerManager = (PowerManager) reactContext.getApplicationContext().getSystemService(Context.POWER_SERVICE);
            if (powerManager != null && (wakeLock == null || !wakeLock.isHeld())) {
                wakeLock = powerManager.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "SaralLekhan:WebShareWakeLock");
                wakeLock.setReferenceCounted(false);
                wakeLock.acquire(4 * 60 * 60 * 1000L); // Max 4 hours
            }

            WifiManager wifiManager = (WifiManager) reactContext.getApplicationContext().getSystemService(Context.WIFI_SERVICE);
            if (wifiManager != null && (wifiLock == null || !wifiLock.isHeld())) {
                wifiLock = wifiManager.createWifiLock(WifiManager.WIFI_MODE_FULL_HIGH_PERF, "SaralLekhan:WebShareWifiLock");
                wifiLock.setReferenceCounted(false);
                wifiLock.acquire();
            }
        } catch (Exception e) {
            Log.w(TAG, "Could not acquire wake/wifi lock", e);
        }
    }

    private void releaseLocks() {
        try {
            if (wakeLock != null && wakeLock.isHeld()) {
                wakeLock.release();
                wakeLock = null;
            }
            if (wifiLock != null && wifiLock.isHeld()) {
                wifiLock.release();
                wifiLock = null;
            }
        } catch (Exception e) {
            Log.w(TAG, "Error releasing wake/wifi lock", e);
        }
    }

    @ReactMethod
    public void updateNotesData(String notesJson, Promise promise) {
        if (notesJson != null) {
            this.notesJsonData.set(notesJson);
            this.dataVersion.incrementAndGet();
        }
        if (promise != null) {
            promise.resolve(true);
        }
    }

    @ReactMethod
    public void getServerUrl(Promise promise) {
        WritableMap result = Arguments.createMap();
        result.putBoolean("isRunning", isRunning);
        result.putString("primaryUrl", primaryServerUrl);
        result.putInt("port", port);

        List<NetworkEndpoint> endpoints = getAvailableEndpoints();
        WritableArray urlsArray = Arguments.createArray();
        for (NetworkEndpoint ep : endpoints) {
            WritableMap item = Arguments.createMap();
            item.putString("ip", ep.ip);
            item.putString("url", "http://" + ep.ip + ":" + this.port);
            item.putString("type", ep.type);
            item.putString("label", ep.label);
            urlsArray.pushMap(item);
        }
        result.putArray("endpoints", urlsArray);
        promise.resolve(result);
    }

    private void handleClient(Socket socket) {
        try (InputStream rawIn = new BufferedInputStream(socket.getInputStream(), 8192);
             OutputStream out = socket.getOutputStream()) {

            String requestLine = readAsciiLine(rawIn);
            if (requestLine == null || requestLine.isEmpty()) return;

            String[] parts = requestLine.split(" ");
            String method = parts.length > 0 ? parts[0] : "GET";
            String path = parts.length > 1 ? parts[1] : "/";

            int contentLength = 0;
            String headerLine;
            while ((headerLine = readAsciiLine(rawIn)) != null && !headerLine.isEmpty()) {
                if (headerLine.toLowerCase().startsWith("content-length:")) {
                    String val = headerLine.substring(headerLine.indexOf(':') + 1).trim();
                    try {
                        contentLength = Integer.parseInt(val);
                    } catch (NumberFormatException ignored) {}
                }
            }

            // CRITICAL FIX: Read exact byte count from raw stream. Never use char reader with Content-Length!
            String body = "";
            if (contentLength > 0 && contentLength < 10485760) { // Max 10MB
                byte[] bodyBytes = new byte[contentLength];
                int totalRead = 0;
                while (totalRead < contentLength) {
                    int read = rawIn.read(bodyBytes, totalRead, contentLength - totalRead);
                    if (read == -1) break;
                    totalRead += read;
                }
                body = new String(bodyBytes, 0, totalRead, StandardCharsets.UTF_8);
            }

            String corsHeaders = "Access-Control-Allow-Origin: *\r\n" +
                                 "Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS\r\n" +
                                 "Access-Control-Allow-Headers: Content-Type, Accept\r\n" +
                                 "Connection: close\r\n";

            if ("OPTIONS".equalsIgnoreCase(method)) {
                String response = "HTTP/1.1 204 No Content\r\n" + corsHeaders + "\r\n";
                out.write(response.getBytes(StandardCharsets.UTF_8));
                out.flush();
                return;
            }

            if ("GET".equalsIgnoreCase(method) && path.startsWith("/api/ping")) {
                byte[] content = "{\"status\":\"ok\",\"app\":\"Saral Lekhan Plus\",\"version\":\"WebStudio 2.0\"}".getBytes(StandardCharsets.UTF_8);
                String header = "HTTP/1.1 200 OK\r\n" +
                                corsHeaders +
                                "Content-Type: application/json; charset=UTF-8\r\n" +
                                "Content-Length: " + content.length + "\r\n\r\n";
                out.write(header.getBytes(StandardCharsets.UTF_8));
                out.write(content);
                out.flush();
                return;
            }

            if ("GET".equalsIgnoreCase(method) && path.startsWith("/api/notes")) {
                byte[] content = notesJsonData.get().getBytes(StandardCharsets.UTF_8);
                String header = "HTTP/1.1 200 OK\r\n" +
                                corsHeaders +
                                "Content-Type: application/json; charset=UTF-8\r\n" +
                                "Cache-Control: no-cache, no-store, must-revalidate\r\n" +
                                "Pragma: no-cache\r\n" +
                                "Expires: 0\r\n" +
                                "ETag: \"v" + dataVersion.get() + "\"\r\n" +
                                "Content-Length: " + content.length + "\r\n\r\n";
                out.write(header.getBytes(StandardCharsets.UTF_8));
                out.write(content);
                out.flush();
                return;
            }

            if ("POST".equalsIgnoreCase(method) && path.startsWith("/api/notes")) {
                final String payload = body;
                if (!payload.isEmpty()) {
                    // Update local in-memory notes cache immediately
                    updateLocalCacheFromPayload(payload);
                    dataVersion.incrementAndGet();

                    // Send event to React Native
                    try {
                        reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                                .emit("onWebShareNotesUpdated", payload);
                    } catch (Exception e) {
                        Log.e(TAG, "Error emitting onWebShareNotesUpdated event", e);
                    }
                }
                byte[] content = "{\"status\":\"success\",\"message\":\"Note action processed\"}".getBytes(StandardCharsets.UTF_8);
                String header = "HTTP/1.1 200 OK\r\n" +
                                corsHeaders +
                                "Content-Type: application/json; charset=UTF-8\r\n" +
                                "Content-Length: " + content.length + "\r\n\r\n";
                out.write(header.getBytes(StandardCharsets.UTF_8));
                out.write(content);
                out.flush();
                return;
            }

            if ("GET".equalsIgnoreCase(method) && ("/".equals(path) || path.startsWith("/index"))) {
                byte[] content = getWebUiHtml().getBytes(StandardCharsets.UTF_8);
                String header = "HTTP/1.1 200 OK\r\n" +
                                corsHeaders +
                                "Content-Type: text/html; charset=UTF-8\r\n" +
                                "Content-Length: " + content.length + "\r\n\r\n";
                out.write(header.getBytes(StandardCharsets.UTF_8));
                out.write(content);
                out.flush();
                return;
            }

            if ("GET".equalsIgnoreCase(method) && "/favicon.ico".equals(path)) {
                byte[] content = "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23c14e28'><path d='M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5zm4 3v2h10V8H7zm0 4v2h10v-2H7zm0 4v2h7v-2H7z'/></svg>".getBytes(StandardCharsets.UTF_8);
                String header = "HTTP/1.1 200 OK\r\n" +
                                corsHeaders +
                                "Content-Type: image/svg+xml\r\n" +
                                "Content-Length: " + content.length + "\r\n\r\n";
                out.write(header.getBytes(StandardCharsets.UTF_8));
                out.write(content);
                out.flush();
                return;
            }

            // 404 Not Found
            byte[] content = "{\"error\":\"Not Found\",\"path\":\"".concat(path).concat("\"}").getBytes(StandardCharsets.UTF_8);
            String header = "HTTP/1.1 404 Not Found\r\n" +
                            corsHeaders +
                            "Content-Type: application/json; charset=UTF-8\r\n" +
                            "Content-Length: " + content.length + "\r\n\r\n";
            out.write(header.getBytes(StandardCharsets.UTF_8));
            out.write(content);
            out.flush();
        } catch (Exception e) {
            Log.e(TAG, "Error handling client socket", e);
        } finally {
            try {
                socket.close();
            } catch (IOException ignored) {}
        }
    }

    private static String readAsciiLine(InputStream in) throws IOException {
        ByteArrayOutputStream baos = new ByteArrayOutputStream(128);
        int b;
        while ((b = in.read()) != -1) {
            if (b == '\n') break;
            if (b != '\r') baos.write(b);
        }
        if (baos.size() == 0 && b == -1) return null;
        return baos.toString("ISO-8859-1");
    }

    private void updateLocalCacheFromPayload(String payload) {
        try {
            JSONObject obj = new JSONObject(payload);
            String action = obj.optString("action", "");
            if ("save".equals(action) && obj.has("note")) {
                JSONObject newNote = obj.getJSONObject("note");
                long noteId = newNote.optLong("id", -1);
                if (noteId != -1) {
                    JSONArray arr = new JSONArray(notesJsonData.get());
                    boolean found = false;
                    for (int i = 0; i < arr.length(); i++) {
                        JSONObject item = arr.getJSONObject(i);
                        if (item.optLong("id") == noteId) {
                            if (newNote.has("title")) item.put("title", newNote.getString("title"));
                            if (newNote.has("body")) item.put("body", newNote.getString("body"));
                            if (newNote.has("tag")) item.put("tag", newNote.getString("tag"));
                            if (newNote.has("pinned")) item.put("pinned", newNote.getBoolean("pinned"));
                            item.put("updated_at", System.currentTimeMillis());
                            found = true;
                            break;
                        }
                    }
                    if (!found) {
                        arr.put(newNote);
                    }
                    notesJsonData.set(arr.toString());
                }
            } else if ("create".equals(action) && obj.has("note")) {
                JSONObject newNote = obj.getJSONObject("note");
                JSONArray arr = new JSONArray(notesJsonData.get());
                JSONArray newArr = new JSONArray();
                newArr.put(newNote);
                for (int i = 0; i < arr.length(); i++) {
                    newArr.put(arr.get(i));
                }
                notesJsonData.set(newArr.toString());
            } else if ("delete".equals(action)) {
                long noteId = obj.optLong("noteId", -1);
                if (noteId != -1) {
                    JSONArray arr = new JSONArray(notesJsonData.get());
                    for (int i = 0; i < arr.length(); i++) {
                        JSONObject item = arr.getJSONObject(i);
                        if (item.optLong("id") == noteId) {
                            item.put("is_deleted", 1);
                            item.put("updated_at", System.currentTimeMillis());
                            break;
                        }
                    }
                    notesJsonData.set(arr.toString());
                }
            } else if ("restore".equals(action)) {
                long noteId = obj.optLong("noteId", -1);
                if (noteId != -1) {
                    JSONArray arr = new JSONArray(notesJsonData.get());
                    for (int i = 0; i < arr.length(); i++) {
                        JSONObject item = arr.getJSONObject(i);
                        if (item.optLong("id") == noteId) {
                            item.put("is_deleted", 0);
                            item.put("updated_at", System.currentTimeMillis());
                            break;
                        }
                    }
                    notesJsonData.set(arr.toString());
                }
            } else if ("permanentlyDelete".equals(action)) {
                long noteId = obj.optLong("noteId", -1);
                if (noteId != -1) {
                    JSONArray arr = new JSONArray(notesJsonData.get());
                    JSONArray newArr = new JSONArray();
                    for (int i = 0; i < arr.length(); i++) {
                        JSONObject item = arr.getJSONObject(i);
                        if (item.optLong("id") != noteId) {
                            newArr.put(item);
                        }
                    }
                    notesJsonData.set(newArr.toString());
                }
            } else if ("emptyTrash".equals(action)) {
                JSONArray arr = new JSONArray(notesJsonData.get());
                JSONArray newArr = new JSONArray();
                for (int i = 0; i < arr.length(); i++) {
                    JSONObject item = arr.getJSONObject(i);
                    if (item.optInt("is_deleted", 0) == 0 && !item.optBoolean("is_deleted", false)) {
                        newArr.put(item);
                    }
                }
                notesJsonData.set(newArr.toString());
            }
            dataVersion.incrementAndGet();
        } catch (Exception e) {
            Log.w(TAG, "Could not update local cache from payload", e);
        }
    }

    /**
     * Discovers all usable IPv4 addresses, categorizing Hotspot vs Local Wi-Fi vs Ethernet.
     */
    public List<NetworkEndpoint> getAvailableEndpoints() {
        List<NetworkEndpoint> hotspotEndpoints = new ArrayList<>();
        List<NetworkEndpoint> wifiEndpoints = new ArrayList<>();
        List<NetworkEndpoint> ethEndpoints = new ArrayList<>();
        List<NetworkEndpoint> otherEndpoints = new ArrayList<>();

        try {
            Enumeration<NetworkInterface> interfaces = NetworkInterface.getNetworkInterfaces();
            while (interfaces != null && interfaces.hasMoreElements()) {
                NetworkInterface intf = interfaces.nextElement();
                if (!intf.isUp()) continue;

                String name = intf.getName().toLowerCase();

                // Exclude VPN and Tunnel interfaces
                if (name.startsWith("tun") || name.startsWith("ppp") || name.startsWith("ipsec") || name.startsWith("tap")) {
                    continue;
                }

                // Exclude Mobile Data / Carrier interfaces
                if (name.contains("rmnet") || name.contains("ccmni") || name.contains("pdp") || 
                    name.contains("clat") || name.contains("radio") || name.contains("wwan") || 
                    name.contains("dummy") || name.contains("sipa")) {
                    continue;
                }

                Enumeration<InetAddress> addrs = intf.getInetAddresses();
                while (addrs.hasMoreElements()) {
                    InetAddress addr = addrs.nextElement();
                    if (!addr.isLoopbackAddress() && addr instanceof Inet4Address) {
                        String ip = addr.getHostAddress();
                        if (ip == null || ip.isEmpty() || ip.startsWith("169.254.") || ip.startsWith("127.")) {
                            continue;
                        }

                        // Hotspot detection (AP / SoftAP / Tethering / Known hotspot subnets)
                        boolean isHotspotName = name.contains("ap") || name.contains("softap") || 
                                                name.contains("swlan") || name.contains("tether") || 
                                                name.contains("rndis") || name.contains("usb") || 
                                                name.contains("bridge");
                        boolean isHotspotIp = ip.startsWith("192.168.43.") || ip.startsWith("192.168.49.") || 
                                              ip.startsWith("192.168.50.") || ip.startsWith("172.20.10.");

                        if (isHotspotName || isHotspotIp) {
                            hotspotEndpoints.add(new NetworkEndpoint(ip, "hotspot", "Mobile Hotspot"));
                        } else if (name.startsWith("wlan") || name.contains("wifi")) {
                            wifiEndpoints.add(new NetworkEndpoint(ip, "wifi", "Local Wi-Fi"));
                        } else if (name.startsWith("eth")) {
                            ethEndpoints.add(new NetworkEndpoint(ip, "ethernet", "Ethernet LAN"));
                        } else {
                            otherEndpoints.add(new NetworkEndpoint(ip, "lan", "Local Network (" + name + ")"));
                        }
                    }
                }
            }
        } catch (Exception e) {
            Log.w(TAG, "Error enumerating network interfaces", e);
        }

        List<NetworkEndpoint> result = new ArrayList<>();
        // Priority order: Hotspot (if hosting) -> Wi-Fi -> Ethernet -> Other
        result.addAll(hotspotEndpoints);
        result.addAll(wifiEndpoints);
        result.addAll(ethEndpoints);
        result.addAll(otherEndpoints);

        if (result.isEmpty()) {
            result.add(new NetworkEndpoint("127.0.0.1", "fallback", "Localhost (Loopback)"));
        }

        return result;
    }

    private String getWebUiHtml() {
        StringBuilder sb = new StringBuilder();
        sb.append("<!DOCTYPE html>\n");
        sb.append("<html lang='en' data-theme='dark'>\n<head>\n<meta charset='UTF-8'>\n<meta name='viewport' content='width=device-width, initial-scale=1.0'>\n");
        sb.append("<title>Saral Lekhan Studio — Web Share</title>\n");
        sb.append("<link rel='preconnect' href='https://fonts.googleapis.com'>\n");
        sb.append("<link rel='preconnect' href='https://fonts.gstatic.com' crossorigin>\n");
        sb.append("<link href='https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap' rel='stylesheet'>\n");
        sb.append("<style>\n");
        
        // Classic Warm Color Palette for Saral Lekhan
        sb.append(":root, [data-theme='dark'] {\n");
        sb.append("  --bg: #1C1A17; --bg-raised: #2B2926; --bg-deep: #12110F;\n");
        sb.append("  --stroke: #3D3A36; --stroke-dim: #2B2926; --stroke-focus: #E8866A;\n");
        sb.append("  --ink: #D9D7D2; --ink-mid: #9B9790; --ink-dim: #696660;\n");
        sb.append("  --accent: #E8866A; --accent-dark: #C14E28; --accent-dim: #8B3118; --accent-bg: #2B2926; --accent-glow: rgba(232, 134, 106, 0.22);\n");
        sb.append("  --card-bg: #24221F; --card-hover: #2E2B27; --card-active: #383430;\n");
        sb.append("  --danger: #ef4444; --danger-bg: rgba(239, 68, 68, 0.15); --success: #10b981; --warning: #f59e0b;\n");
        sb.append("  --shadow-key: 0 4px 14px rgba(0,0,0,0.5); --radius-pill: 9999px; --radius-card: 14px; --radius-sm: 8px;\n");
        sb.append("}\n");

        sb.append("[data-theme='light'] {\n");
        sb.append("  --bg: #D9D7D2; --bg-raised: #E2E0DB; --bg-deep: #C8C6C1;\n");
        sb.append("  --stroke: #2B2926; --stroke-dim: #9B9790; --stroke-focus: #C14E28;\n");
        sb.append("  --ink: #1C1A17; --ink-mid: #5A5751; --ink-dim: #8E8B85;\n");
        sb.append("  --accent: #C14E28; --accent-dark: #8B3118; --accent-dim: #E8866A; --accent-bg: #F2D5C8; --accent-glow: rgba(193, 78, 40, 0.22);\n");
        sb.append("  --card-bg: #EAE8E3; --card-hover: #F2F0EC; --card-active: #FFFFFF;\n");
        sb.append("  --danger: #dc2626; --danger-bg: rgba(220, 38, 38, 0.12); --success: #059669; --warning: #d97706;\n");
        sb.append("  --shadow-key: 0 4px 12px rgba(43,41,38,0.12); --radius-pill: 9999px; --radius-card: 14px; --radius-sm: 8px;\n");
        sb.append("}\n");

        // Base & Layout
        sb.append("* { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }\n");
        sb.append("body { background: var(--bg); color: var(--ink); display: flex; height: 100vh; overflow: hidden; transition: background 0.2s ease, color 0.2s ease; }\n");

        // Sidebar
        sb.append(".sidebar { width: 350px; background: var(--bg-raised); border-right: 1px solid var(--stroke); display: flex; flex-direction: column; flex-shrink: 0; z-index: 10; }\n");
        sb.append(".brand-header { padding: 16px 20px; border-bottom: 1px solid var(--stroke); display: flex; align-items: center; justify-content: space-between; }\n");
        sb.append(".brand-logo { font-size: 17px; font-weight: 700; color: var(--ink); display: flex; align-items: center; gap: 8px; letter-spacing: -0.3px; }\n");
        sb.append(".pulse-beacon { width: 8px; height: 8px; border-radius: var(--radius-pill); background: var(--success); box-shadow: 0 0 8px var(--success); animation: pulse 2s infinite; display: inline-block; }\n");
        sb.append("@keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.45; transform: scale(0.85); } }\n");
        sb.append(".brand-actions { display: flex; align-items: center; gap: 8px; }\n");

        // Physical Mechanical Buttons (Pill-forward style)
        sb.append(".key-btn { border: 1px solid var(--stroke); border-radius: var(--radius-pill); background: var(--card-bg); color: var(--ink); padding: 7px 14px; font-size: 12.5px; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; transition: transform 0.08s ease, background 0.15s ease, border-color 0.15s ease; user-select: none; box-shadow: 0 2px 0 var(--stroke); }\n");
        sb.append(".key-btn:hover { background: var(--card-hover); border-color: var(--accent); }\n");
        sb.append(".key-btn:active { transform: translateY(2px); box-shadow: none; }\n");
        sb.append(".key-btn.primary { background: var(--accent); color: #fff; border-color: var(--accent-dark); box-shadow: 0 2px 0 var(--accent-dark); }\n");
        sb.append(".key-btn.primary:hover { background: var(--accent-dark); }\n");
        sb.append(".key-btn.icon-only { width: 32px; height: 32px; padding: 0; justify-content: center; border-radius: var(--radius-pill); }\n");
        sb.append(".key-btn.danger { background: var(--danger-bg); color: var(--danger); border-color: var(--danger); box-shadow: 0 2px 0 rgba(239,68,68,0.4); }\n");
        sb.append(".key-btn.danger:hover { background: var(--danger); color: #fff; }\n");
        sb.append(".key-btn.success { background: rgba(16,185,129,0.15); color: var(--success); border-color: var(--success); box-shadow: 0 2px 0 rgba(16,185,129,0.4); }\n");
        sb.append(".key-btn.success:hover { background: var(--success); color: #fff; }\n");
        sb.append(".refresh-btn-icon { display: inline-block; transition: transform 0.2s ease; }\n");
        sb.append(".refresh-btn-icon.spin { animation: spin 0.6s cubic-bezier(0.4, 0, 0.2, 1); }\n");
        sb.append("@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }\n");

        // Nav Tabs (All, Pinned, Trash)
        sb.append(".nav-tabs { display: flex; padding: 8px 12px; gap: 6px; border-bottom: 1px solid var(--stroke); background: var(--bg-deep); }\n");
        sb.append(".nav-tab { flex: 1; padding: 7px 6px; border-radius: var(--radius-pill); border: 1px solid transparent; background: transparent; color: var(--ink-mid); font-size: 11.5px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; transition: all 0.15s ease; }\n");
        sb.append(".nav-tab:hover { background: var(--card-bg); color: var(--ink); }\n");
        sb.append(".nav-tab.active { background: var(--card-bg); color: var(--accent); border-color: var(--stroke); box-shadow: 0 2px 0 var(--stroke); }\n");
        sb.append(".badge-pill { font-size: 10px; background: rgba(128,128,128,0.18); padding: 1px 6px; border-radius: var(--radius-pill); color: var(--ink-dim); font-weight: 700; }\n");
        sb.append(".nav-tab.active .badge-pill { background: var(--accent); color: #fff; }\n");

        // Search Bar & Tag Rail
        sb.append(".search-box { padding: 10px 14px; border-bottom: 1px solid var(--stroke); }\n");
        sb.append(".search-input { width: 100%; padding: 8px 14px; border-radius: var(--radius-pill); border: 1px solid var(--stroke); background: var(--card-bg); color: var(--ink); outline: none; font-size: 12.5px; transition: border-color 0.15s ease; }\n");
        sb.append(".search-input:focus { border-color: var(--stroke-focus); }\n");
        sb.append(".tag-rail { display: flex; gap: 6px; overflow-x: auto; padding: 8px 14px; border-bottom: 1px solid var(--stroke); scrollbar-width: none; background: var(--bg-deep); }\n");
        sb.append(".tag-rail::-webkit-scrollbar { display: none; }\n");
        sb.append(".filter-tag { padding: 3px 10px; border-radius: var(--radius-pill); font-size: 11px; font-weight: 600; background: var(--card-bg); color: var(--ink-mid); border: 1px solid var(--stroke); cursor: pointer; white-space: nowrap; transition: all 0.15s ease; }\n");
        sb.append(".filter-tag:hover { color: var(--ink); border-color: var(--accent); }\n");
        sb.append(".filter-tag.active { background: var(--accent); color: #fff; border-color: var(--accent-dark); }\n");

        // Notes List Items
        sb.append(".notes-list { flex: 1; overflow-y: auto; padding: 10px; }\n");
        sb.append(".note-card { padding: 13px 15px; border-radius: var(--radius-card); cursor: pointer; margin-bottom: 7px; background: var(--card-bg); border: 1px solid var(--stroke); transition: all 0.15s ease; position: relative; }\n");
        sb.append(".note-card:hover { background: var(--card-hover); border-color: var(--accent-dim); transform: translateY(-1px); }\n");
        sb.append(".note-card.active { background: var(--card-active); border-color: var(--accent); border-left-width: 4px; box-shadow: var(--shadow-key); }\n");
        sb.append(".note-card-title { font-size: 14px; font-weight: 600; color: var(--ink); margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: flex; align-items: center; justify-content: space-between; }\n");
        sb.append(".star-icon { color: var(--warning); font-size: 12px; }\n");
        sb.append(".note-card-snippet { font-size: 12px; color: var(--ink-dim); height: 32px; overflow: hidden; text-overflow: ellipsis; line-height: 1.35; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }\n");
        sb.append(".note-card-footer { display: flex; align-items: center; justify-content: space-between; margin-top: 8px; font-size: 10.5px; color: var(--ink-dim); }\n");
        sb.append(".tag-capsule { background: var(--accent-bg); color: var(--accent); padding: 2px 7px; border-radius: var(--radius-pill); font-weight: 600; font-size: 10px; border: 1px solid rgba(193,78,40,0.18); }\n");

        // Trash Bar in Sidebar
        sb.append(".trash-bar { padding: 8px 14px; background: var(--danger-bg); border-bottom: 1px solid rgba(239,68,68,0.2); display: flex; align-items: center; justify-content: space-between; font-size: 11.5px; color: var(--danger); font-weight: 600; }\n");

        // Editor Panel
        sb.append(".editor-panel { flex: 1; display: flex; flex-direction: column; background: var(--bg); }\n");
        sb.append(".editor-topbar { padding: 12px 28px; border-bottom: 1px solid var(--stroke); display: flex; align-items: center; justify-content: space-between; background: var(--bg-raised); }\n");
        sb.append(".sync-pill { display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 500; color: var(--ink-mid); background: var(--bg-deep); padding: 5px 12px; border-radius: var(--radius-pill); border: 1px solid var(--stroke); transition: all 0.2s ease; }\n");
        sb.append(".sync-pill.saved { color: var(--success); border-color: var(--success); background: rgba(16,185,129,0.08); }\n");
        sb.append(".sync-pill.failed { color: var(--danger); border-color: var(--danger); background: var(--danger-bg); cursor: pointer; }\n");
        sb.append(".topbar-actions { display: flex; align-items: center; gap: 8px; }\n");

        // Rich Styling Toolbar (with H1, H2, H3, P and Segmented Mode Switcher)
        sb.append(".styling-toolbar { padding: 8px 28px; background: var(--bg-deep); border-bottom: 1px solid var(--stroke); display: flex; flex-wrap: wrap; align-items: center; gap: 5px; }\n");
        sb.append(".tool-pill { border: 1px solid var(--stroke); background: var(--card-bg); color: var(--ink); border-radius: var(--radius-sm); min-width: 30px; height: 30px; padding: 0 8px; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; font-size: 12px; font-weight: 600; transition: all 0.1s ease; user-select: none; }\n");
        sb.append(".tool-pill:hover { background: var(--card-hover); border-color: var(--accent); color: var(--accent); }\n");
        sb.append(".tool-pill:active { transform: translateY(1px); }\n");
        sb.append(".tool-pill.active { background: var(--accent); color: #fff; border-color: var(--accent-dark); }\n");
        sb.append(".tool-sep { width: 1px; height: 18px; background: var(--stroke); margin: 0 4px; }\n");
        
        // Segmented Control for Visual ↔ Source Mode
        sb.append(".segmented-control { margin-left: auto; display: inline-flex; background: var(--card-bg); border: 1px solid var(--stroke); border-radius: var(--radius-pill); padding: 2px; gap: 2px; }\n");
        sb.append(".segmented-btn { padding: 4px 12px; border-radius: var(--radius-pill); border: none; background: transparent; color: var(--ink-mid); font-size: 11.5px; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 4px; transition: all 0.15s ease; }\n");
        sb.append(".segmented-btn.active { background: var(--accent); color: #ffffff; box-shadow: 0 1px 4px rgba(0,0,0,0.2); }\n");

        // Editor Scroll Canvas
        sb.append(".editor-canvas { flex: 1; overflow-y: auto; padding: 28px 50px; display: flex; flex-direction: column; }\n");
        sb.append(".editor-title-row { display: flex; align-items: center; gap: 14px; margin-bottom: 12px; }\n");
        sb.append(".editor-title-input { flex: 1; font-size: 28px; font-weight: 700; background: transparent; border: none; color: var(--ink); outline: none; letter-spacing: -0.4px; }\n");
        sb.append(".editor-title-input::placeholder { color: var(--ink-dim); opacity: 0.6; }\n");
        
        // Tag Capsule Input
        sb.append(".editor-tag-row { display: flex; align-items: center; gap: 10px; margin-bottom: 22px; }\n");
        sb.append(".tag-input-capsule { display: inline-flex; align-items: center; gap: 4px; background: var(--card-bg); border: 1px solid var(--stroke); border-radius: var(--radius-pill); padding: 5px 12px; font-size: 12px; color: var(--accent); font-weight: 600; }\n");
        sb.append(".tag-input-field { background: transparent; border: none; outline: none; color: var(--accent); font-size: 12px; font-weight: 600; width: 140px; }\n");
        sb.append(".tag-input-field::placeholder { color: var(--ink-dim); font-weight: 400; }\n");

        // Rich Content Area & Typography (Clean, robust code block and quote styles)
        sb.append(".rich-canvas { flex: 1; min-height: 400px; outline: none; color: var(--ink); font-size: 15.5px; line-height: 1.75; word-break: break-word; }\n");
        sb.append(".rich-canvas h1 { font-size: 25px; font-weight: 700; color: var(--ink); margin: 18px 0 8px; border: none !important; padding: 0 !important; }\n");
        sb.append(".rich-canvas h2 { font-size: 20px; font-weight: 600; color: var(--ink); margin: 14px 0 6px; }\n");
        sb.append(".rich-canvas h3 { font-size: 17px; font-weight: 600; color: var(--ink); margin: 12px 0 4px; }\n");
        sb.append(".rich-canvas p { margin-bottom: 12px; }\n");
        sb.append(".rich-canvas ul, .rich-canvas ol { padding-left: 26px; margin-bottom: 12px; }\n");
        sb.append(".rich-canvas li { margin-bottom: 4px; }\n");
        sb.append(".rich-canvas blockquote { border-left: 3.5px solid var(--accent); padding: 8px 16px; color: var(--ink-mid); background: var(--accent-bg); margin: 12px 0; border-radius: 0 var(--radius-sm) var(--radius-sm) 0; font-style: italic; }\n");
        sb.append(".rich-canvas pre { background: var(--bg-deep); padding: 14px 18px; border-radius: var(--radius-sm); border: 1px solid var(--stroke); overflow-x: auto; margin: 12px 0; font-family: 'JetBrains Mono', Consolas, Monaco, monospace; font-size: 13.5px; line-height: 1.6; }\n");
        sb.append(".rich-canvas code { font-family: 'JetBrains Mono', Consolas, Monaco, monospace; font-size: 13px; color: var(--accent); background: var(--card-bg); padding: 2px 6px; border-radius: 4px; border: 1px solid var(--stroke); }\n");
        sb.append(".rich-canvas pre code { border: none; background: transparent; padding: 0; color: var(--ink); font-size: 13.5px; }\n");
        sb.append(".rich-canvas a { color: var(--accent); text-decoration: underline; text-underline-offset: 3px; }\n");
        sb.append(".rich-canvas hr { border: none; border-top: 1px solid var(--stroke); margin: 18px 0; }\n");
        
        sb.append(".raw-canvas { width: 100%; flex: 1; min-height: 400px; font-family: 'JetBrains Mono', monospace; font-size: 14px; line-height: 1.65; background: var(--bg-deep); border: 1px solid var(--stroke); border-radius: var(--radius-sm); padding: 16px; color: var(--ink); resize: none; outline: none; display: none; }\n");

        // Trash Alert Banner in Editor
        sb.append(".trash-alert-banner { background: var(--danger-bg); border: 1px solid rgba(239,68,68,0.3); border-radius: var(--radius-sm); padding: 12px 18px; margin-bottom: 18px; font-size: 13px; color: var(--danger); font-weight: 500; display: flex; align-items: center; justify-content: space-between; }\n");

        // Footer Bar & Toast
        sb.append(".editor-bottombar { padding: 10px 28px; border-top: 1px solid var(--stroke); font-size: 11.5px; color: var(--ink-dim); display: flex; justify-content: space-between; background: var(--bg-raised); }\n");
        sb.append(".toast-pill { position: fixed; bottom: 24px; right: 24px; background: var(--card-active); color: var(--ink); border: 1px solid var(--stroke); padding: 10px 18px; border-radius: var(--radius-pill); font-size: 12.5px; font-weight: 600; box-shadow: var(--shadow-key); transform: translateY(80px); opacity: 0; transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1); pointer-events: none; z-index: 1000; display: flex; align-items: center; gap: 8px; }\n");
        sb.append(".toast-pill.show { transform: translateY(0); opacity: 1; }\n");
        sb.append(".toast-pill.success { border-color: var(--success); color: var(--success); }\n");
        sb.append(".toast-pill.error { border-color: var(--danger); color: var(--danger); }\n");

        sb.append("</style>\n</head>\n<body>\n");

        // Sidebar Markup (English only logo)
        sb.append("<div class='sidebar'>\n");
        sb.append("  <div class='brand-header'>\n");
        sb.append("    <div class='brand-logo'>\n");
        sb.append("      <div class='pulse-beacon' title='Connected Live to Mobile'></div>\n");
        sb.append("      <span>Saral Lekhan</span>\n");
        sb.append("    </div>\n");
        sb.append("    <div class='brand-actions'>\n");
        sb.append("      <button class='key-btn icon-only' id='themeToggleBtn' title='Toggle Dark / Light Theme' onclick='toggleTheme()'>🌙</button>\n");
        sb.append("      <button class='key-btn icon-only' id='sidebarRefreshBtn' title='Refresh notes from phone' onclick='manualRefresh()'><span class='refresh-btn-icon'>🔄</span></button>\n");
        sb.append("      <button class='key-btn primary' id='newNoteBtn' title='Create New Note'>+ New Note</button>\n");
        sb.append("    </div>\n");
        sb.append("  </div>\n");
 
        // Tabs
        sb.append("  <div class='nav-tabs'>\n");
        sb.append("    <button class='nav-tab active' id='tabAll' onclick=\"switchTab('all')\"><span>All Notes</span><span class='badge-pill' id='badgeAll'>0</span></button>\n");
        sb.append("    <button class='nav-tab' id='tabPinned' onclick=\"switchTab('pinned')\"><span>★ Pinned</span><span class='badge-pill' id='badgePinned'>0</span></button>\n");
        sb.append("    <button class='nav-tab' id='tabTrash' onclick=\"switchTab('trash')\"><span>🗑 Trash</span><span class='badge-pill' id='badgeTrash'>0</span></button>\n");
        sb.append("  </div>\n");
 
        // Search & Tags
        sb.append("  <div class='search-box'><input type='text' class='search-input' id='searchInput' placeholder='Search notes... (Ctrl+F)'></div>\n");
        sb.append("  <div class='tag-rail' id='tagRail'></div>\n");
        sb.append("  <div id='trashHeaderContainer'></div>\n");
        sb.append("  <div class='notes-list' id='notesList'></div>\n");
        sb.append("</div>\n");
 
        // Editor Panel Markup
        sb.append("<div class='editor-panel'>\n");
        sb.append("  <div class='editor-topbar'>\n");
        sb.append("    <div class='sync-pill' id='syncStatus'><span>✓ Live Sync Active</span></div>\n");
        sb.append("    <div class='topbar-actions' id='topbarActions'>\n");
        sb.append("      <button class='key-btn' id='topbarRefreshBtn' onclick='manualRefresh()' title='Refresh note from phone'><span class='refresh-btn-icon'>🔄</span> Refresh</button>\n");
        sb.append("      <button class='key-btn' id='pinBtn' onclick='togglePin()' title='Pin Note'>☆ Pin</button>\n");
        sb.append("      <button class='key-btn danger' id='deleteBtn' onclick='trashCurrentNote()' title='Move to Trash'>Trash</button>\n");
        sb.append("      <button class='key-btn' id='copyBtn' onclick='copyContent()' title='Copy Note Content'>Copy</button>\n");
        sb.append("      <button class='key-btn primary' id='saveBtn' onclick='saveCurrentNote()' title='Save to Phone (Ctrl+S)'>Save to Phone</button>\n");
        sb.append("    </div>\n");
        sb.append("  </div>\n");

        // Formatting Toolbar Markup (with H1, H2, H3, P buttons and Segmented Switcher)
        sb.append("  <div class='styling-toolbar' id='stylingToolbar'>\n");
        sb.append("    <button class='tool-pill' onclick=\"applyHeading('p')\" title='Normal Paragraph'>P</button>\n");
        sb.append("    <button class='tool-pill' onclick=\"applyHeading('h1')\" title='Heading 1'>H1</button>\n");
        sb.append("    <button class='tool-pill' onclick=\"applyHeading('h2')\" title='Heading 2'>H2</button>\n");
        sb.append("    <button class='tool-pill' onclick=\"applyHeading('h3')\" title='Heading 3'>H3</button>\n");
        sb.append("    <div class='tool-sep'></div>\n");
        sb.append("    <button class='tool-pill' onclick=\"exec('bold')\" title='Bold (Ctrl+B)'><b>B</b></button>\n");
        sb.append("    <button class='tool-pill' onclick=\"exec('italic')\" title='Italic (Ctrl+I)'><i>I</i></button>\n");
        sb.append("    <button class='tool-pill' onclick=\"exec('underline')\" title='Underline (Ctrl+U)'><u>U</u></button>\n");
        sb.append("    <button class='tool-pill' onclick=\"exec('strikeThrough')\" title='Strikethrough'><s>S</s></button>\n");
        sb.append("    <div class='tool-sep'></div>\n");
        sb.append("    <button class='tool-pill' onclick=\"exec('insertUnorderedList')\" title='Bullet List'>• List</button>\n");
        sb.append("    <button class='tool-pill' onclick=\"exec('insertOrderedList')\" title='Numbered List'>1. List</button>\n");
        sb.append("    <button class='tool-pill' onclick=\"applyBlockquote()\" title='Quote (Click again to toggle off)'>&ldquo; Quote</button>\n");
        sb.append("    <button class='tool-pill' onclick=\"applyCode()\" title='Code / Code Block'>&lt;/&gt; Code</button>\n");
        sb.append("    <button class='tool-pill' onclick=\"applyLink()\" title='Insert Link'>🔗 Link</button>\n");
        sb.append("    <button class='tool-pill' onclick=\"exec('insertHorizontalRule')\" title='Divider Line'>—</button>\n");
        sb.append("    <button class='tool-pill' onclick=\"clearFormatting()\" title='Clear All Formatting'>✕ Clear</button>\n");
        sb.append("    <div class='tool-sep'></div>\n");
        sb.append("    <button class='tool-pill' onclick=\"exec('undo')\" title='Undo (Ctrl+Z)'>↩</button>\n");
        sb.append("    <button class='tool-pill' onclick=\"exec('redo')\" title='Redo (Ctrl+Y)'>↪</button>\n");
        sb.append("    <div class='segmented-control'>\n");
        sb.append("      <button class='segmented-btn active' id='btnVisual' onclick=\"switchMode('visual')\">👁 Visual</button>\n");
        sb.append("      <button class='segmented-btn' id='btnSource' onclick=\"switchMode('source')\">⌨ Source</button>\n");
        sb.append("    </div>\n");
        sb.append("  </div>\n");

        // Editor Canvas Markup
        sb.append("  <div class='editor-canvas'>\n");
        sb.append("    <div id='trashBannerContainer'></div>\n");
        sb.append("    <div class='editor-title-row'>\n");
        sb.append("      <input type='text' class='editor-title-input' id='editTitle' placeholder='Note Title...'>\n");
        sb.append("    </div>\n");
        sb.append("    <div class='editor-tag-row'>\n");
        sb.append("      <div class='tag-input-capsule'>\n");
        sb.append("        <span>#</span>\n");
        sb.append("        <input type='text' class='tag-input-field' id='editTag' placeholder='tag (e.g. work)'>\n");
        sb.append("      </div>\n");
        sb.append("    </div>\n");
        sb.append("    <div class='rich-canvas' id='richEditor' contenteditable='true' placeholder='Start writing here...'></div>\n");
        sb.append("    <textarea class='raw-canvas' id='rawEditor' placeholder='Raw HTML / Markdown...'></textarea>\n");
        sb.append("  </div>\n");

        // Footer Bar Markup
        sb.append("  <div class='editor-bottombar'>\n");
        sb.append("    <span id='wordCount'>0 words · 0 characters</span>\n");
        sb.append("    <span>Saral Lekhan Studio · Local Wireless Sync</span>\n");
        sb.append("  </div>\n");
        sb.append("</div>\n");
        sb.append("<div class='toast-pill' id='toast'>Saved to phone!</div>\n");

        // JavaScript Logic
        sb.append("<script>\n");
        sb.append("let allNotes = [];\n");
        sb.append("let currentTab = 'all';\n");
        sb.append("let selectedTag = null;\n");
        sb.append("let activeNoteId = null;\n");
        sb.append("let isCreatingNew = false;\n");
        sb.append("let isPinned = false;\n");
        sb.append("let editorMode = 'visual';\n");
        sb.append("let isDirty = false;\n");
        sb.append("let autoSaveTimer = null;\n");
        sb.append("let currentTheme = localStorage.getItem('saral_lekhan_web_theme') || 'dark';\n");

        // Theme management
        sb.append("function applyTheme(theme) {\n");
        sb.append("  currentTheme = theme;\n");
        sb.append("  document.documentElement.setAttribute('data-theme', theme);\n");
        sb.append("  localStorage.setItem('saral_lekhan_web_theme', theme);\n");
        sb.append("  const btn = document.getElementById('themeToggleBtn');\n");
        sb.append("  if (btn) btn.innerText = theme === 'dark' ? '🌙' : '☀️';\n");
        sb.append("}\n");
        sb.append("function toggleTheme() {\n");
        sb.append("  applyTheme(currentTheme === 'dark' ? 'light' : 'dark');\n");
        sb.append("}\n");
        sb.append("applyTheme(currentTheme);\n");

        // Populate editor fields
        sb.append("function populateEditorFields(n) {\n");
        sb.append("  document.getElementById('editTitle').value = n.title || '';\n");
        sb.append("  document.getElementById('editTag').value = n.tag || '';\n");
        sb.append("  isPinned = Boolean(n.pinned);\n");
        sb.append("  updatePinButton();\n");
        sb.append("  const richEl = document.getElementById('richEditor');\n");
        sb.append("  const rawEl = document.getElementById('rawEditor');\n");
        sb.append("  if (editorMode === 'source') {\n");
        sb.append("    rawEl.value = n.body || '';\n");
        sb.append("    richEl.innerHTML = n.body || '';\n");
        sb.append("  } else {\n");
        sb.append("    richEl.innerHTML = n.body || '';\n");
        sb.append("    rawEl.value = n.body || '';\n");
        sb.append("  }\n");
        sb.append("  renderTrashBanner(Boolean(n.is_deleted));\n");
        sb.append("  renderHeaderActions(Boolean(n.is_deleted));\n");
        sb.append("  updateCounts();\n");
        sb.append("}\n");

        // Fetch notes with real-time change detection and auto-reload
        sb.append("async function fetchNotes(forceReload = false) {\n");
        sb.append("  try {\n");
        sb.append("    const res = await fetch('/api/notes?t=' + Date.now(), { cache: 'no-store' });\n");
        sb.append("    if (!res.ok) return;\n");
        sb.append("    const data = await res.json();\n");
        sb.append("    const fetched = Array.isArray(data) ? data : [];\n");
        sb.append("    if (activeNoteId && !isCreatingNew) {\n");
        sb.append("      const serverNote = fetched.find(x => x.id === activeNoteId);\n");
        sb.append("      const localNote = allNotes.find(x => x.id === activeNoteId);\n");
        sb.append("      if (serverNote) {\n");
        sb.append("        const hasChanged = !localNote ||\n");
        sb.append("          serverNote.title !== localNote.title ||\n");
        sb.append("          serverNote.body !== localNote.body ||\n");
        sb.append("          (serverNote.tag || '') !== (localNote.tag || '') ||\n");
        sb.append("          Boolean(serverNote.pinned) !== Boolean(localNote.pinned) ||\n");
        sb.append("          Boolean(serverNote.is_deleted) !== Boolean(localNote.is_deleted) ||\n");
        sb.append("          (serverNote.updated_at && localNote.updated_at && serverNote.updated_at !== localNote.updated_at);\n");
        sb.append("        if (hasChanged) {\n");
        sb.append("          if (!isDirty || forceReload) {\n");
        sb.append("            isDirty = false;\n");
        sb.append("            clearTimeout(autoSaveTimer);\n");
        sb.append("            populateEditorFields(serverNote);\n");
        sb.append("            setSyncStatus('✓ Live Sync Active', true);\n");
        sb.append("            if (forceReload) showToast('Refreshed note from phone!', 'success');\n");
        sb.append("            else showToast('Note updated from phone', 'success');\n");
        sb.append("          } else {\n");
        sb.append("            setSyncStatus('⚠️ Phone updated note (Click Refresh to load)', false);\n");
        sb.append("          }\n");
        sb.append("        }\n");
        sb.append("      }\n");
        sb.append("      if (isDirty) {\n");
        sb.append("        const cur = allNotes.find(x => x.id === activeNoteId);\n");
        sb.append("        if (cur) {\n");
        sb.append("          const idx = fetched.findIndex(x => x.id === activeNoteId);\n");
        sb.append("          if (idx !== -1) fetched[idx] = Object.assign({}, fetched[idx], cur);\n");
        sb.append("        }\n");
        sb.append("      }\n");
        sb.append("    }\n");
        sb.append("    allNotes = fetched;\n");
        sb.append("    updateCountsAndBadges();\n");
        sb.append("    renderTags();\n");
        sb.append("    renderList();\n");
        sb.append("    if (!isCreatingNew && !isDirty && allNotes.length > 0 && !activeNoteId) {\n");
        sb.append("      const activeList = getFilteredNotes();\n");
        sb.append("      if (activeList.length > 0) selectNote(activeList[0].id);\n");
        sb.append("    }\n");
        sb.append("  } catch (err) {\n");
        sb.append("    console.warn('Fetch notes failed:', err);\n");
        sb.append("    if (forceReload) throw err;\n");
        sb.append("  }\n");
        sb.append("}\n");

        // Manual Refresh with spin animation and dirty check
        sb.append("async function manualRefresh() {\n");
        sb.append("  const icons = document.querySelectorAll('.refresh-btn-icon');\n");
        sb.append("  icons.forEach(i => i.classList.add('spin'));\n");
        sb.append("  setSyncStatus('Refreshing from phone...', false);\n");
        sb.append("  try {\n");
        sb.append("    if (isDirty && activeNoteId) {\n");
        sb.append("      if (!confirm('You have unsaved changes on this note. Reloading will overwrite with phone data. Continue?')) {\n");
        sb.append("        icons.forEach(i => i.classList.remove('spin'));\n");
        sb.append("        setSyncStatus('Live Sync Active', false);\n");
        sb.append("        return;\n");
        sb.append("      }\n");
        sb.append("    }\n");
        sb.append("    await fetchNotes(true);\n");
        sb.append("    showToast('✓ Refreshed from phone!', 'success');\n");
        sb.append("    setSyncStatus('✓ Synced with phone', true);\n");
        sb.append("  } catch (err) {\n");
        sb.append("    showToast('Error refreshing notes', 'error');\n");
        sb.append("    setSyncStatus('⚠️ Refresh failed', false);\n");
        sb.append("  } finally {\n");
        sb.append("    setTimeout(() => icons.forEach(i => i.classList.remove('spin')), 600);\n");
        sb.append("  }\n");
        sb.append("}\n");

        // Filter notes
        sb.append("function getFilteredNotes() {\n");
        sb.append("  const query = document.getElementById('searchInput').value.toLowerCase().trim();\n");
        sb.append("  return allNotes.filter(n => {\n");
        sb.append("    const isDeleted = Boolean(n.is_deleted);\n");
        sb.append("    if (currentTab === 'trash') { if (!isDeleted) return false; }\n");
        sb.append("    else if (currentTab === 'pinned') { if (isDeleted || !n.pinned) return false; }\n");
        sb.append("    else { if (isDeleted) return false; }\n");
        sb.append("    if (selectedTag && (n.tag || '').toLowerCase() !== selectedTag.toLowerCase()) return false;\n");
        sb.append("    if (query) {\n");
        sb.append("      const text = ((n.title || '') + ' ' + (n.body || '') + ' ' + (n.tag || '')).toLowerCase();\n");
        sb.append("      if (!text.includes(query)) return false;\n");
        sb.append("    }\n");
        sb.append("    return true;\n");
        sb.append("  });\n");
        sb.append("}\n");

        sb.append("function updateCountsAndBadges() {\n");
        sb.append("  const allActive = allNotes.filter(n => !n.is_deleted);\n");
        sb.append("  const pinnedActive = allActive.filter(n => n.pinned);\n");
        sb.append("  const trashNotes = allNotes.filter(n => n.is_deleted);\n");
        sb.append("  document.getElementById('badgeAll').innerText = allActive.length;\n");
        sb.append("  document.getElementById('badgePinned').innerText = pinnedActive.length;\n");
        sb.append("  document.getElementById('badgeTrash').innerText = trashNotes.length;\n");
        sb.append("}\n");

        sb.append("function renderTags() {\n");
        sb.append("  const rail = document.getElementById('tagRail');\n");
        sb.append("  const activeNotes = allNotes.filter(n => !n.is_deleted);\n");
        sb.append("  const tagSet = new Set();\n");
        sb.append("  activeNotes.forEach(n => { if (n.tag && n.tag.trim()) tagSet.add(n.tag.trim()); });\n");
        sb.append("  if (tagSet.size === 0) { rail.style.display = 'none'; return; }\n");
        sb.append("  rail.style.display = 'flex';\n");
        sb.append("  rail.innerHTML = '';\n");
        sb.append("  const allTag = document.createElement('button');\n");
        sb.append("  allTag.className = 'filter-tag' + (selectedTag === null ? ' active' : '');\n");
        sb.append("  allTag.innerText = 'All Tags';\n");
        sb.append("  allTag.onclick = () => { selectedTag = null; renderTags(); renderList(); };\n");
        sb.append("  rail.appendChild(allTag);\n");
        sb.append("  tagSet.forEach(tag => {\n");
        sb.append("    const btn = document.createElement('button');\n");
        sb.append("    btn.className = 'filter-tag' + (selectedTag === tag ? ' active' : '');\n");
        sb.append("    btn.innerText = '#' + tag;\n");
        sb.append("    btn.onclick = () => { selectedTag = (selectedTag === tag ? null : tag); renderTags(); renderList(); };\n");
        sb.append("    rail.appendChild(btn);\n");
        sb.append("  });\n");
        sb.append("}\n");

        sb.append("function formatCardDate(timestamp) {\n");
        sb.append("  if (!timestamp) return '';\n");
        sb.append("  const date = new Date(timestamp);\n");
        sb.append("  const now = new Date();\n");
        sb.append("  if (date.toDateString() === now.toDateString()) {\n");
        sb.append("    return 'Today, ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });\n");
        sb.append("  }\n");
        sb.append("  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });\n");
        sb.append("}\n");

        sb.append("function cleanTextSnippet(body) {\n");
        sb.append("  if (!body) return 'Empty note';\n");
        sb.append("  const tmp = document.createElement('div');\n");
        sb.append("  tmp.innerHTML = body;\n");
        sb.append("  const txt = (tmp.textContent || tmp.innerText || '').replace(/\\s+/g, ' ').trim();\n");
        sb.append("  return txt.substring(0, 90) || 'Empty note';\n");
        sb.append("}\n");

        sb.append("function renderList() {\n");
        sb.append("  const listEl = document.getElementById('notesList');\n");
        sb.append("  const trashContainer = document.getElementById('trashHeaderContainer');\n");
        sb.append("  if (currentTab === 'trash') {\n");
        sb.append("    trashContainer.innerHTML = `<div class='trash-bar'><span>Trash View</span><button class='key-btn danger' style='padding:3px 8px; font-size:11px;' onclick='emptyTrash()'>Empty Trash</button></div>`;\n");
        sb.append("  } else { trashContainer.innerHTML = ''; }\n");
        sb.append("  const filtered = getFilteredNotes();\n");
        sb.append("  listEl.innerHTML = '';\n");
        sb.append("  if (filtered.length === 0) {\n");
        sb.append("    const msg = currentTab === 'trash' ? 'Trash is empty' : (isCreatingNew ? 'Creating new note...' : 'No notes found');\n");
        sb.append("    listEl.innerHTML = `<div style=\"padding:40px 10px; color:var(--ink-dim); text-align:center; font-size:13px;\">${msg}</div>`;\n");
        sb.append("    return;\n");
        sb.append("  }\n");
        sb.append("  filtered.forEach(n => {\n");
        sb.append("    const el = document.createElement('div');\n");
        sb.append("    el.className = 'note-card' + (n.id === activeNoteId && !isCreatingNew ? ' active' : '');\n");
        sb.append("    const cleanSnippet = cleanTextSnippet(n.body);\n");
        sb.append("    const dateStr = formatCardDate(n.updated_at);\n");
        sb.append("    el.innerHTML = `<div class='note-card-title'><span>${escapeHtml(n.title || 'Untitled')}</span>${n.pinned ? '<span class=\"star-icon\">★</span>' : ''}</div><div class='note-card-snippet'>${escapeHtml(cleanSnippet)}</div><div class='note-card-footer'><span>${dateStr}</span>${n.tag ? `<span class='tag-capsule'>#${escapeHtml(n.tag)}</span>` : ''}</div>`;\n");
        sb.append("    el.onclick = () => selectNote(n.id);\n");
        sb.append("    listEl.appendChild(el);\n");
        sb.append("  });\n");
        sb.append("}\n");

        sb.append("function selectNote(id) {\n");
        sb.append("  if (isDirty && activeNoteId && activeNoteId !== id) {\n");
        sb.append("    const prevNote = allNotes.find(x => x.id === activeNoteId);\n");
        sb.append("    if (prevNote && !prevNote.is_deleted) saveNoteSilently();\n");
        sb.append("  }\n");
        sb.append("  clearTimeout(autoSaveTimer);\n");
        sb.append("  isCreatingNew = false;\n");
        sb.append("  activeNoteId = id;\n");
        sb.append("  isDirty = false;\n");
        sb.append("  const n = allNotes.find(x => x.id === id);\n");
        sb.append("  if (!n) return;\n");
        sb.append("  populateEditorFields(n);\n");
        sb.append("  renderList();\n");
        sb.append("}\n");
 
        sb.append("function renderTrashBanner(isDeleted) {\n");
        sb.append("  const container = document.getElementById('trashBannerContainer');\n");
        sb.append("  const stylingToolbar = document.getElementById('stylingToolbar');\n");
        sb.append("  const richEditor = document.getElementById('richEditor');\n");
        sb.append("  if (isDeleted) {\n");
        sb.append("    container.innerHTML = `<div class='trash-alert-banner'><span>⚠️ This note is in Trash. Restore it to make edits.</span><div style='display:flex; gap:8px;'><button class='key-btn success' onclick='restoreNote(${activeNoteId})'>Restore</button><button class='key-btn danger' onclick='deleteForever(${activeNoteId})'>Delete Forever</button></div></div>`;\n");
        sb.append("    stylingToolbar.style.display = 'none';\n");
        sb.append("    richEditor.contentEditable = 'false';\n");
        sb.append("  } else {\n");
        sb.append("    container.innerHTML = '';\n");
        sb.append("    stylingToolbar.style.display = 'flex';\n");
        sb.append("    richEditor.contentEditable = 'true';\n");
        sb.append("  }\n");
        sb.append("}\n");
 
        sb.append("function renderHeaderActions(isDeleted) {\n");
        sb.append("  const actions = document.getElementById('topbarActions');\n");
        sb.append("  if (isDeleted) {\n");
        sb.append("    actions.innerHTML = `<button class='key-btn' id='topbarRefreshBtn' onclick='manualRefresh()' title='Refresh note from phone'><span class='refresh-btn-icon'>🔄</span> Refresh</button><button class='key-btn success' onclick='restoreNote(${activeNoteId})'>Restore</button><button class='key-btn danger' onclick='deleteForever(${activeNoteId})'>Delete Forever</button>`;\n");
        sb.append("  } else {\n");
        sb.append("    actions.innerHTML = `<button class='key-btn' id='topbarRefreshBtn' onclick='manualRefresh()' title='Refresh note from phone'><span class='refresh-btn-icon'>🔄</span> Refresh</button><button class='key-btn' id='pinBtn' onclick='togglePin()'>${isPinned ? '★ Pinned' : '☆ Pin'}</button><button class='key-btn danger' id='deleteBtn' onclick='trashCurrentNote()'>Trash</button><button class='key-btn' id='copyBtn' onclick='copyContent()'>Copy</button><button class='key-btn primary' id='saveBtn' onclick='saveCurrentNote()'>Save to Phone</button>`;\n");
        sb.append("  }\n");
        sb.append("}\n");
 
        sb.append("function updatePinButton() {\n");
        sb.append("  const btn = document.getElementById('pinBtn');\n");
        sb.append("  if (btn) {\n");
        sb.append("    btn.innerText = isPinned ? '★ Pinned' : '☆ Pin';\n");
        sb.append("    if (isPinned) btn.classList.add('primary'); else btn.classList.remove('primary');\n");
        sb.append("  }\n");
        sb.append("}\n");
 
        sb.append("function togglePin() {\n");
        sb.append("  isPinned = !isPinned;\n");
        sb.append("  updatePinButton();\n");
        sb.append("  isDirty = true;\n");
        sb.append("  triggerAutoSave();\n");
        sb.append("}\n");
 
        sb.append("function triggerAutoSave() {\n");
        sb.append("  clearTimeout(autoSaveTimer);\n");
        sb.append("  setSyncStatus('Saving...', false);\n");
        sb.append("  autoSaveTimer = setTimeout(() => { saveCurrentNote(true); }, 1200);\n");
        sb.append("}\n");
 
        sb.append("function setSyncStatus(text, isSaved) {\n");
        sb.append("  const el = document.getElementById('syncStatus');\n");
        sb.append("  if (el) {\n");
        sb.append("    el.innerHTML = `<span>${text}</span>`;\n");
        sb.append("    const isFailed = text.includes('failed');\n");
        sb.append("    const isReloadPrompt = text.includes('Click Refresh');\n");
        sb.append("    el.className = 'sync-pill' + (isSaved ? ' saved' : (isFailed || isReloadPrompt ? ' failed' : ''));\n");
        sb.append("    if (isFailed) {\n");
        sb.append("      el.onclick = () => saveCurrentNote(false);\n");
        sb.append("    } else if (isReloadPrompt) {\n");
        sb.append("      el.onclick = () => manualRefresh();\n");
        sb.append("    } else {\n");
        sb.append("      el.onclick = null;\n");
        sb.append("    }\n");
        sb.append("  }\n");
        sb.append("}\n");

        sb.append("async function saveCurrentNote(isAuto = false) {\n");
        sb.append("  syncEditorContentToModel();\n");
        sb.append("  const title = document.getElementById('editTitle').value.trim();\n");
        sb.append("  const tag = document.getElementById('editTag').value.trim();\n");
        sb.append("  const body = editorMode === 'visual' ? document.getElementById('richEditor').innerHTML : document.getElementById('rawEditor').value;\n");
        sb.append("  if (!title && !body && isCreatingNew) return;\n");
        sb.append("  const action = isCreatingNew ? 'create' : 'save';\n");
        sb.append("  const noteId = isCreatingNew ? Date.now() : activeNoteId;\n");
        sb.append("  const notePayload = { id: noteId, title: title || 'Untitled', tag, body, pinned: isPinned, updated_at: Date.now() };\n");
        sb.append("  try {\n");
        sb.append("    const res = await fetch('/api/notes', {\n");
        sb.append("      method: 'POST',\n");
        sb.append("      headers: { 'Content-Type': 'application/json' },\n");
        sb.append("      body: JSON.stringify({ action, note: notePayload })\n");
        sb.append("    });\n");
        sb.append("    if (!res.ok) throw new Error('HTTP ' + res.status);\n");
        sb.append("    isDirty = false;\n");
        sb.append("    setSyncStatus('✓ Synced with phone', true);\n");
        sb.append("    if (!isAuto) showToast('Saved to mobile device!', 'success');\n");
        sb.append("    if (isCreatingNew) {\n");
        sb.append("      isCreatingNew = false;\n");
        sb.append("      activeNoteId = noteId;\n");
        sb.append("      allNotes.unshift(notePayload);\n");
        sb.append("    } else {\n");
        sb.append("      const existing = allNotes.find(x => x.id === activeNoteId);\n");
        sb.append("      if (existing) Object.assign(existing, notePayload);\n");
        sb.append("    }\n");
        sb.append("    updateCountsAndBadges();\n");
        sb.append("    renderTags();\n");
        sb.append("    renderList();\n");
        sb.append("  } catch(e) {\n");
        sb.append("    console.error('Save note failed:', e);\n");
        sb.append("    setSyncStatus('⚠️ Sync failed (Click to retry)', false);\n");
        sb.append("    if(!isAuto) showToast('Error saving note: ' + (e.message || ''), 'error');\n");
        sb.append("  }\n");
        sb.append("}\n");

        sb.append("async function saveNoteSilently() {\n");
        sb.append("  await saveCurrentNote(true);\n");
        sb.append("}\n");

        sb.append("async function trashCurrentNote() {\n");
        sb.append("  if (!activeNoteId) return;\n");
        sb.append("  clearTimeout(autoSaveTimer);\n");
        sb.append("  isDirty = false;\n");
        sb.append("  const targetId = activeNoteId;\n");
        sb.append("  const note = allNotes.find(x => x.id === targetId);\n");
        sb.append("  if (note) note.is_deleted = true;\n");
        sb.append("  try {\n");
        sb.append("    const res = await fetch('/api/notes', {\n");
        sb.append("      method: 'POST',\n");
        sb.append("      headers: { 'Content-Type': 'application/json' },\n");
        sb.append("      body: JSON.stringify({ action: 'delete', noteId: targetId })\n");
        sb.append("    });\n");
        sb.append("    if (!res.ok) throw new Error('HTTP ' + res.status);\n");
        sb.append("    showToast('Moved note to Trash', 'success');\n");
        sb.append("    updateCountsAndBadges();\n");
        sb.append("    const nextActive = getFilteredNotes();\n");
        sb.append("    if (nextActive.length > 0) {\n");
        sb.append("      selectNote(nextActive[0].id);\n");
        sb.append("    } else {\n");
        sb.append("      resetEditorBlank();\n");
        sb.append("    }\n");
        sb.append("  } catch (e) { showToast('Error moving to trash', 'error'); }\n");
        sb.append("}\n");

        sb.append("function resetEditorBlank() {\n");
        sb.append("  clearTimeout(autoSaveTimer);\n");
        sb.append("  isCreatingNew = true;\n");
        sb.append("  activeNoteId = null;\n");
        sb.append("  isDirty = false;\n");
        sb.append("  isPinned = false;\n");
        sb.append("  document.getElementById('editTitle').value = '';\n");
        sb.append("  document.getElementById('editTag').value = '';\n");
        sb.append("  document.getElementById('richEditor').innerHTML = '';\n");
        sb.append("  document.getElementById('rawEditor').value = '';\n");
        sb.append("  updatePinButton();\n");
        sb.append("  renderTrashBanner(false);\n");
        sb.append("  renderHeaderActions(false);\n");
        sb.append("  renderList();\n");
        sb.append("  updateCounts();\n");
        sb.append("}\n");

        sb.append("async function restoreNote(id) {\n");
        sb.append("  try {\n");
        sb.append("    const res = await fetch('/api/notes', {\n");
        sb.append("      method: 'POST',\n");
        sb.append("      headers: { 'Content-Type': 'application/json' },\n");
        sb.append("      body: JSON.stringify({ action: 'restore', noteId: id })\n");
        sb.append("    });\n");
        sb.append("    if (!res.ok) throw new Error('HTTP ' + res.status);\n");
        sb.append("    const note = allNotes.find(x => x.id === id);\n");
        sb.append("    if (note) note.is_deleted = false;\n");
        sb.append("    showToast('Note restored!', 'success');\n");
        sb.append("    updateCountsAndBadges();\n");
        sb.append("    renderList();\n");
        sb.append("    renderTrashBanner(false);\n");
        sb.append("    renderHeaderActions(false);\n");
        sb.append("  } catch (e) { showToast('Error restoring note', 'error'); }\n");
        sb.append("}\n");

        sb.append("async function deleteForever(id) {\n");
        sb.append("  if (!confirm('Permanently delete this note? This cannot be undone.')) return;\n");
        sb.append("  try {\n");
        sb.append("    const res = await fetch('/api/notes', {\n");
        sb.append("      method: 'POST',\n");
        sb.append("      headers: { 'Content-Type': 'application/json' },\n");
        sb.append("      body: JSON.stringify({ action: 'permanentlyDelete', noteId: id })\n");
        sb.append("    });\n");
        sb.append("    if (!res.ok) throw new Error('HTTP ' + res.status);\n");
        sb.append("    allNotes = allNotes.filter(x => x.id !== id);\n");
        sb.append("    showToast('Permanently deleted', 'success');\n");
        sb.append("    updateCountsAndBadges();\n");
        sb.append("    const next = getFilteredNotes();\n");
        sb.append("    if (next.length > 0) selectNote(next[0].id);\n");
        sb.append("    else resetEditorBlank();\n");
        sb.append("  } catch (e) { showToast('Error deleting', 'error'); }\n");
        sb.append("}\n");

        sb.append("async function emptyTrash() {\n");
        sb.append("  if (!confirm('Permanently delete ALL notes in trash?')) return;\n");
        sb.append("  try {\n");
        sb.append("    const res = await fetch('/api/notes', {\n");
        sb.append("      method: 'POST',\n");
        sb.append("      headers: { 'Content-Type': 'application/json' },\n");
        sb.append("      body: JSON.stringify({ action: 'emptyTrash' })\n");
        sb.append("    });\n");
        sb.append("    if (!res.ok) throw new Error('HTTP ' + res.status);\n");
        sb.append("    allNotes = allNotes.filter(x => !x.is_deleted);\n");
        sb.append("    showToast('Trash emptied', 'success');\n");
        sb.append("    updateCountsAndBadges();\n");
        sb.append("    renderList();\n");
        sb.append("    resetEditorBlank();\n");
        sb.append("  } catch (e) { showToast('Error emptying trash', 'error'); }\n");
        sb.append("}\n");

        sb.append("function createNewNote() {\n");
        sb.append("  if (isDirty && activeNoteId) {\n");
        sb.append("    const note = allNotes.find(x => x.id === activeNoteId);\n");
        sb.append("    if (note && !note.is_deleted) saveNoteSilently();\n");
        sb.append("  }\n");
        sb.append("  clearTimeout(autoSaveTimer);\n");
        sb.append("  isCreatingNew = true;\n");
        sb.append("  activeNoteId = null;\n");
        sb.append("  isDirty = false;\n");
        sb.append("  isPinned = false;\n");
        sb.append("  document.getElementById('editTitle').value = '';\n");
        sb.append("  document.getElementById('editTag').value = selectedTag || '';\n");
        sb.append("  document.getElementById('richEditor').innerHTML = '';\n");
        sb.append("  document.getElementById('rawEditor').value = '';\n");
        sb.append("  updatePinButton();\n");
        sb.append("  renderTrashBanner(false);\n");
        sb.append("  renderHeaderActions(false);\n");
        sb.append("  renderList();\n");
        sb.append("  document.getElementById('editTitle').focus();\n");
        sb.append("  updateCounts();\n");
        sb.append("}\n");

        sb.append("function copyContent() {\n");
        sb.append("  const title = document.getElementById('editTitle').value;\n");
        sb.append("  const text = document.getElementById('richEditor').innerText;\n");
        sb.append("  navigator.clipboard.writeText(`# ${title}\\n\\n${text}`);\n");
        sb.append("  showToast('Copied to clipboard!', 'success');\n");
        sb.append("}\n");

        sb.append("function updateCounts() {\n");
        sb.append("  const text = document.getElementById('richEditor').innerText.trim();\n");
        sb.append("  const chars = text.length;\n");
        sb.append("  const words = text ? text.split(/\\s+/).filter(Boolean).length : 0;\n");
        sb.append("  document.getElementById('wordCount').innerText = `${words} words · ${chars} characters`;\n");
        sb.append("}\n");

        sb.append("function escapeHtml(str) {\n");
        sb.append("  return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');\n");
        sb.append("}\n");

        sb.append("function showToast(msg, type = 'success') {\n");
        sb.append("  const t = document.getElementById('toast');\n");
        sb.append("  t.innerText = msg || 'Saved';\n");
        sb.append("  t.className = 'toast-pill show ' + type;\n");
        sb.append("  setTimeout(() => { t.className = 'toast-pill'; }, 2600);\n");
        sb.append("}\n");

        // Styling Commands
        sb.append("function exec(command, value = null) {\n");
        sb.append("  document.getElementById('richEditor').focus();\n");
        sb.append("  document.execCommand(command, false, value);\n");
        sb.append("  isDirty = true;\n");
        sb.append("  triggerAutoSave();\n");
        sb.append("  updateCounts();\n");
        sb.append("}\n");

        sb.append("function applyHeading(tag) {\n");
        sb.append("  document.getElementById('richEditor').focus();\n");
        sb.append("  document.execCommand('formatBlock', false, tag);\n");
        sb.append("  isDirty = true;\n");
        sb.append("  triggerAutoSave();\n");
        sb.append("  updateCounts();\n");
        sb.append("}\n");

        // Toggle Blockquote
        sb.append("function applyBlockquote() {\n");
        sb.append("  document.getElementById('richEditor').focus();\n");
        sb.append("  const sel = window.getSelection();\n");
        sb.append("  let inQuote = false;\n");
        sb.append("  if (sel && sel.rangeCount > 0) {\n");
        sb.append("    let node = sel.anchorNode;\n");
        sb.append("    const editor = document.getElementById('richEditor');\n");
        sb.append("    while (node && node !== editor) {\n");
        sb.append("      if (node.nodeName === 'BLOCKQUOTE') { inQuote = true; break; }\n");
        sb.append("      node = node.parentNode;\n");
        sb.append("    }\n");
        sb.append("  }\n");
        sb.append("  if (inQuote) {\n");
        sb.append("    document.execCommand('formatBlock', false, 'p');\n");
        sb.append("    showToast('Quote toggled off');\n");
        sb.append("  } else {\n");
        sb.append("    document.execCommand('formatBlock', false, 'blockquote');\n");
        sb.append("    showToast('Quote applied');\n");
        sb.append("  }\n");
        sb.append("  isDirty = true;\n");
        sb.append("  triggerAutoSave();\n");
        sb.append("  updateCounts();\n");
        sb.append("}\n");

        sb.append("function clearFormatting() {\n");
        sb.append("  document.getElementById('richEditor').focus();\n");
        sb.append("  document.execCommand('removeFormat', false, null);\n");
        sb.append("  document.execCommand('formatBlock', false, 'p');\n");
        sb.append("  document.execCommand('unlink', false, null);\n");
        sb.append("  isDirty = true;\n");
        sb.append("  triggerAutoSave();\n");
        sb.append("  updateCounts();\n");
        sb.append("  showToast('Formatting cleared');\n");
        sb.append("}\n");

        // Fixed Robust Code block & inline code application (No placeholder "code" or "&nbsp;" text)
        sb.append("function applyCode() {\n");
        sb.append("  document.getElementById('richEditor').focus();\n");
        sb.append("  const selection = window.getSelection();\n");
        sb.append("  if (!selection || !selection.rangeCount) return;\n");
        sb.append("  let node = selection.anchorNode;\n");
        sb.append("  const editor = document.getElementById('richEditor');\n");
        sb.append("  let inCode = false;\n");
        sb.append("  while (node && node !== editor) {\n");
        sb.append("    if (node.nodeName === 'CODE' || node.nodeName === 'PRE') { inCode = true; break; }\n");
        sb.append("    node = node.parentNode;\n");
        sb.append("  }\n");
        sb.append("  if (inCode) {\n");
        sb.append("    document.execCommand('removeFormat', false, null);\n");
        sb.append("    document.execCommand('formatBlock', false, 'p');\n");
        sb.append("    showToast('Code mode removed');\n");
        sb.append("    isDirty = true;\n");
        sb.append("    triggerAutoSave();\n");
        sb.append("    updateCounts();\n");
        sb.append("    return;\n");
        sb.append("  }\n");
        sb.append("  const text = selection.toString();\n");
        sb.append("  if (text.includes('\\n')) {\n");
        sb.append("    document.execCommand('insertHTML', false, `<pre><code>${escapeHtml(text)}</code></pre><p><br></p>`);\n");
        sb.append("  } else if (text.length > 0) {\n");
        sb.append("    document.execCommand('insertHTML', false, `<code>${escapeHtml(text)}</code>`);\n");
        sb.append("  } else {\n");
        sb.append("    document.execCommand('insertHTML', false, `<code>&#8203;</code>`);\n");
        sb.append("  }\n");
        sb.append("  isDirty = true;\n");
        sb.append("  triggerAutoSave();\n");
        sb.append("  updateCounts();\n");
        sb.append("}\n");

        sb.append("function applyLink() {\n");
        sb.append("  const url = prompt('Enter link URL (e.g. https://example.com):');\n");
        sb.append("  if (url) {\n");
        sb.append("    document.getElementById('richEditor').focus();\n");
        sb.append("    document.execCommand('createLink', false, url);\n");
        sb.append("    isDirty = true;\n");
        sb.append("    triggerAutoSave();\n");
        sb.append("  }\n");
        sb.append("}\n");

        sb.append("function switchMode(mode) {\n");
        sb.append("  editorMode = mode;\n");
        sb.append("  const richEl = document.getElementById('richEditor');\n");
        sb.append("  const rawEl = document.getElementById('rawEditor');\n");
        sb.append("  const btnVisual = document.getElementById('btnVisual');\n");
        sb.append("  const btnSource = document.getElementById('btnSource');\n");
        sb.append("  if (mode === 'source') {\n");
        sb.append("    rawEl.value = richEl.innerHTML;\n");
        sb.append("    richEl.style.display = 'none';\n");
        sb.append("    rawEl.style.display = 'block';\n");
        sb.append("    btnSource.classList.add('active');\n");
        sb.append("    btnVisual.classList.remove('active');\n");
        sb.append("  } else {\n");
        sb.append("    richEl.innerHTML = rawEl.value;\n");
        sb.append("    rawEl.style.display = 'none';\n");
        sb.append("    richEl.style.display = 'block';\n");
        sb.append("    btnVisual.classList.add('active');\n");
        sb.append("    btnSource.classList.remove('active');\n");
        sb.append("  }\n");
        sb.append("}\n");

        sb.append("function switchTab(tab) {\n");
        sb.append("  currentTab = tab;\n");
        sb.append("  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));\n");
        sb.append("  if (tab === 'all') document.getElementById('tabAll').classList.add('active');\n");
        sb.append("  if (tab === 'pinned') document.getElementById('tabPinned').classList.add('active');\n");
        sb.append("  if (tab === 'trash') document.getElementById('tabTrash').classList.add('active');\n");
        sb.append("  renderList();\n");
        sb.append("}\n");

        sb.append("function syncEditorContentToModel() {\n");
        sb.append("  const richEl = document.getElementById('richEditor');\n");
        sb.append("  const rawEl = document.getElementById('rawEditor');\n");
        sb.append("  if (editorMode === 'source') {\n");
        sb.append("    richEl.innerHTML = rawEl.value;\n");
        sb.append("  } else {\n");
        sb.append("    rawEl.value = richEl.innerHTML;\n");
        sb.append("  }\n");
        sb.append("}\n");

        // Event Listeners
        sb.append("document.getElementById('newNoteBtn').addEventListener('click', createNewNote);\n");
        sb.append("document.getElementById('searchInput').addEventListener('input', renderList);\n");
        sb.append("document.getElementById('richEditor').addEventListener('input', () => { isDirty = true; updateCounts(); triggerAutoSave(); });\n");
        sb.append("document.getElementById('rawEditor').addEventListener('input', () => { isDirty = true; updateCounts(); triggerAutoSave(); });\n");
        sb.append("document.getElementById('editTitle').addEventListener('input', () => { isDirty = true; triggerAutoSave(); });\n");
        sb.append("document.getElementById('editTag').addEventListener('input', () => { isDirty = true; triggerAutoSave(); });\n");

        // Keyboard handler for escaping blockquote on empty line enter
        sb.append("document.getElementById('richEditor').addEventListener('keydown', (e) => {\n");
        sb.append("  if (e.key === 'Enter') {\n");
        sb.append("    const sel = window.getSelection();\n");
        sb.append("    if (!sel || !sel.rangeCount) return;\n");
        sb.append("    let node = sel.anchorNode;\n");
        sb.append("    while (node && node !== document.getElementById('richEditor')) {\n");
        sb.append("      if (node.nodeName === 'BLOCKQUOTE') {\n");
        sb.append("        const text = node.innerText || '';\n");
        sb.append("        if (text.trim() === '') {\n");
        sb.append("          e.preventDefault();\n");
        sb.append("          document.execCommand('formatBlock', false, 'p');\n");
        sb.append("        }\n");
        sb.append("        break;\n");
        sb.append("      }\n");
        sb.append("      node = node.parentNode;\n");
        sb.append("    }\n");
        sb.append("  }\n");
        sb.append("});\n");

        sb.append("document.addEventListener('keydown', (e) => {\n");
        sb.append("  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {\n");
        sb.append("    e.preventDefault(); saveCurrentNote();\n");
        sb.append("  }\n");
        sb.append("  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {\n");
        sb.append("    e.preventDefault(); document.getElementById('searchInput').focus();\n");
        sb.append("  }\n");
        sb.append("});\n");

        sb.append("fetchNotes();\n");
        sb.append("setInterval(() => fetchNotes(false), 3000);\n");
        sb.append("</script>\n</body>\n</html>\n");
        return sb.toString();
    }
}
