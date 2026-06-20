package com.focusfight.app;

import android.app.AppOpsManager;
import android.app.usage.UsageStats;
import android.app.usage.UsageStatsManager;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.provider.Settings;
import androidx.annotation.NonNull;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.getcapacitor.annotation.ActivityCallback;
import androidx.activity.result.ActivityResult;

@CapacitorPlugin(name = "UsageStats")
public class UsageStatsPlugin extends Plugin {

  @PluginMethod
  public void hasUsagePermission(PluginCall call) {
    boolean granted = false;
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
      UsageStatsManager manager = (UsageStatsManager) getContext().getSystemService(Context.USAGE_STATS_SERVICE);
      long now = System.currentTimeMillis();
      List<UsageStats> stats = manager.queryUsageStats(UsageStatsManager.INTERVAL_DAILY, now - 1000 * 60, now);
      granted = stats != null && !stats.isEmpty();
    }
    JSObject response = new JSObject();
    response.put("granted", granted);
    call.resolve(response);
  }

  @PluginMethod
  public void requestUsagePermission(PluginCall call) {
    Intent intent = new Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS);
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      intent.setData(android.net.Uri.parse("package:" + getContext().getPackageName()));
    }
    
    try {
      startActivityForResult(call, intent, "usagePermissionResultCallback");
    } catch (Exception e) {
      // Fallback for some OEMs that crash on targeted intents
      Intent fallback = new Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS);
      startActivityForResult(call, fallback, "usagePermissionResultCallback");
    }
  }

  @ActivityCallback
  private void usagePermissionResultCallback(PluginCall call, ActivityResult result) {
    JSObject res = new JSObject();
    res.put("granted", checkPermission());
    call.resolve(res);
  }

  @PluginMethod
  public void queryUsageStats(PluginCall call) {
    long start = call.getLong("start", System.currentTimeMillis() - 1000L * 60 * 60 * 24);
    long end = call.getLong("end", System.currentTimeMillis());
    int interval = call.getInt("interval", UsageStatsManager.INTERVAL_DAILY);
    JSArray packageArray = call.getArray("packageNames");

    UsageStatsManager manager = (UsageStatsManager) getContext().getSystemService(Context.USAGE_STATS_SERVICE);
    List<UsageStats> stats = manager.queryUsageStats(interval, start, end);

    Map<String, Long> totals = new HashMap<>();
    if (stats != null) {
      for (UsageStats usage : stats) {
        String packageName = usage.getPackageName();
        if (packageArray != null && packageArray.length() > 0) {
          if (!containsPackage(packageArray, packageName)) {
            continue;
          }
        }
        totals.put(packageName, totals.getOrDefault(packageName, 0L) + usage.getTotalTimeInForeground());
      }
    }

    JSObject result = new JSObject();
    JSArray output = new JSArray();
    for (Map.Entry<String, Long> entry : totals.entrySet()) {
      JSObject item = new JSObject();
      item.put("packageName", entry.getKey());
      item.put("milliseconds", entry.getValue());
      output.put(item);
    }

    result.put("stats", output);
    call.resolve(result);
  }

  private boolean containsPackage(JSArray array, String packageName) {
    for (int i = 0; i < array.length(); i++) {
      if (packageName.equals(array.optString(i))) {
        return true;
      }
    }
    return false;
  }



  private boolean checkPermission() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.KITKAT) {
      return true;
    }
    UsageStatsManager manager = (UsageStatsManager) getContext().getSystemService(Context.USAGE_STATS_SERVICE);
    long now = System.currentTimeMillis();
    List<UsageStats> stats = manager.queryUsageStats(UsageStatsManager.INTERVAL_DAILY, now - 1000 * 60, now);
    return stats != null && !stats.isEmpty();
  }
}
