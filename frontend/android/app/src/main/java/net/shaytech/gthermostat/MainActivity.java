package net.shaytech.gthermostat;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

import net.shaytech.gthermostat.plugins.SafeAreaPlugin.SafeAreaPlugin;

public class MainActivity extends BridgeActivity {
    @Override
        public void onCreate(Bundle savedInstanceState) {
            registerPlugin(SafeAreaPlugin.class);
            super.onCreate(savedInstanceState);
        }

}
