package com.aurafitness.app;

import android.Manifest;
import android.os.Build;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import android.content.pm.PackageManager;
import android.content.Context;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import com.getcapacitor.PermissionState;

@CapacitorPlugin(
    name = "AuraPermissions",
    permissions = {
        @Permission(
            alias = "location",
            strings = { Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION }
        ),
        @Permission(
            alias = "activity",
            strings = { Manifest.permission.ACTIVITY_RECOGNITION }
        )
    }
)
public class AuraPermissionsPlugin extends Plugin {

    @PluginMethod
    public void checkPermissions(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("location", getPermissionState("location").toString());
        ret.put("activity", getPermissionState("activity").toString());
        call.resolve(ret);
    }

    @PluginMethod
    public void requestLocationPermission(PluginCall call) {
        if (getPermissionState("location") != PermissionState.GRANTED) {
            requestPermissionForAlias("location", call, "locationCallback");
        } else {
            JSObject ret = new JSObject();
            ret.put("status", "granted");
            call.resolve(ret);
        }
    }

    @PermissionCallback
    private void locationCallback(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("status", getPermissionState("location").toString());
        call.resolve(ret);
    }

    @PluginMethod
    public void requestActivityPermission(PluginCall call) {
        Context context = getContext();
        if (Build.VERSION.SDK_INT >= 29) { // Android 10+
            if (ContextCompat.checkSelfPermission(context, "android.permission.ACTIVITY_RECOGNITION") != PackageManager.PERMISSION_GRANTED) {
                ActivityCompat.requestPermissions(
                    getActivity(),
                    new String[]{"android.permission.ACTIVITY_RECOGNITION"},
                    102
                );
                JSObject ret = new JSObject();
                ret.put("status", "requested");
                call.resolve(ret);
            } else {
                JSObject ret = new JSObject();
                ret.put("status", "granted");
                call.resolve(ret);
            }
        } else {
            JSObject ret = new JSObject();
            ret.put("status", "granted");
            call.resolve(ret);
        }
    }

    @PluginMethod
    public void getDeviceSteps(PluginCall call) {
        MainActivity.registerStepSensor(getContext());
        JSObject ret = new JSObject();
        ret.put("steps", MainActivity.latestSensorSteps);
        call.resolve(ret);
    }
}
