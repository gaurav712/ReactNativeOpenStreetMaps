import React, {useState, useRef, LegacyRef} from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Text,
  TextInput,
} from 'react-native';
import WebView from 'react-native-webview';

const App = () => {
  const webViewRef = useRef();
  const [routeFrom, setRouteFrom] = useState('');
  const [routeTo, setRouteTo] = useState('');

  const sendRoutesToWebView = () => {
    if (!routeFrom || !routeTo) {
      console.warn('Fields cannot be blank!');
      return;
    }

    if (webViewRef.current) {
      // @ts-ignore
      webViewRef.current.postMessage(`${routeFrom}:${routeTo}`);
    }
  };

  const processMessagesFromWebView = (message: string) => {
    const action = message.split(':')[0];

    switch (action) {
      case 'to':
        setRouteTo(message.split(':')[1]);
        break;
      case 'from':
        setRouteFrom(message.split(':')[1]);
        break;
    }
  };

  const messageListenerEventJS = `
    function observeElement(element, property, callback, delay = 0) {
        let elementPrototype = Object.getPrototypeOf(element);
        if (elementPrototype.hasOwnProperty(property)) {
            let descriptor = Object.getOwnPropertyDescriptor(elementPrototype, property);
            Object.defineProperty(element, property, {
                get: function() {
                    return descriptor.get.apply(this, arguments);
                },
                set: function () {
                    let oldValue = this[property];
                    descriptor.set.apply(this, arguments);
                    let newValue = this[property];
                    if (typeof callback == "function") {
                        setTimeout(callback.bind(this, oldValue, newValue), delay);
                    }
                    return newValue;
                }
            });
        }
    }

    document.addEventListener('message', (event) => {
      const routeFrom = event.data.split(':')[0];
      const routeTo = event.data.split(':')[1];

      const routeFromInput = document.getElementById('route_from');
      const routeToInput = document.getElementById('route_to');

      const onChangeEvent = new Event("change");

      routeFromInput.value = routeFrom;
      routeFromInput.dispatchEvent(onChangeEvent);

      routeToInput.value = routeTo;
      routeToInput.dispatchEvent(onChangeEvent);

      document.getElementsByClassName('routing_go')[0].click()

      observeElement(routeFromInput, "value", (_, newValue) => {
        ReactNativeWebView.postMessage("from:" + newValue);
      });

      observeElement(routeToInput, "value", (_, newValue) => {
        ReactNativeWebView.postMessage("to:" + newValue);
      });
    });
    true;
  `;

  const initialJS = `
    let list = document.getElementsByClassName('leaflet-top leaflet-right');
    for(let index = 0; index < list.length; index++) {
      list[index].style.display = 'none';
    }

    list = document.getElementsByClassName('leaflet-control-attribution leaflet-control');
    for(let index = 0; index < list.length; index++) {
      list[index].style.display = 'none';
    }

    document.getElementsByTagName('header')[0].style.display = 'none';
    const mapContainer = document.getElementById('content').style.top = 0;
    true;
  `;

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef as LegacyRef<any>}
        style={styles.webview}
        source={{uri: 'https://www.openstreetmap.org'}}
        javaScriptEnabled={true}
        injectedJavaScript={initialJS}
        injectedJavaScriptBeforeContentLoaded={messageListenerEventJS}
        onMessage={event => {
          const {data} = event.nativeEvent;
          processMessagesFromWebView(data);
        }}
      />
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.inputElement}
          placeholder="From"
          placeholderTextColor={'grey'}
          value={routeFrom}
          onChangeText={value => setRouteFrom(value)}
        />
        <TextInput
          style={styles.inputElement}
          placeholder="To"
          placeholderTextColor={'grey'}
          value={routeTo}
          onChangeText={value => setRouteTo(value)}
        />
        <TouchableOpacity
          style={styles.directionsButton}
          onPress={sendRoutesToWebView}>
          <Text style={styles.directionsButtonText}>GO</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
  directionsButton: {
    height: 40,
    width: 40,
    borderRadius: 20,
    zIndex: 100,
    backgroundColor: 'teal',
    position: 'absolute',
    top: 32.5,
    right: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  directionsButtonText: {
    color: 'white',
  },
  inputContainer: {
    position: 'absolute',
    bottom: 30,
    zIndex: 100,
    width: '90%',
    marginHorizontal: '5%',
    paddingHorizontal: '2.5%',
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: 'white',
  },
  inputElement: {
    height: 40,
    color: 'black',
  },
});

export default App;
