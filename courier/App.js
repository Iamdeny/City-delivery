import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import { useSocket } from './hooks/useSocket';

const CourierApp = () => {
  const [currentOrder, setCurrentOrder] = useState(null);
  const [location, setLocation] = useState(null);
  const [route, setRoute] = useState([]);
  const socket = useSocket();

  // Запрашиваем разрешение на геолокацию
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Ошибка', 'Нужно разрешение на геолокацию');
        return;
      }

      // Следим за местоположением
      Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000,
          distanceInterval: 10,
        },
        (newLocation) => {
          setLocation(newLocation.coords);

          // Отправляем на сервер
          socket.emit('location-update', {
            courierId: user.id,
            lat: newLocation.coords.latitude,
            lng: newLocation.coords.longitude,
          });
        }
      );
    })();
  }, []);

  // Получаем текущий заказ
  const fetchCurrentOrder = async () => {
    try {
      const response = await fetch(`${API_URL}/api/courier/current-order`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const order = await response.json();
      setCurrentOrder(order);

      if (order) {
        // Получаем маршрут
        const routeResponse = await fetch(
          `${API_URL}/api/delivery/route/${order.id}`
        );
        const routeData = await routeResponse.json();
        setRoute(routeData.points);
      }
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось загрузить заказ');
    }
  };

  // Обновить статус заказа
  const updateOrderStatus = async (status) => {
    try {
      await fetch(`${API_URL}/api/courier/update-status`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          orderId: currentOrder.id,
          status: status,
        }),
      });

      socket.emit('order-status-update', {
        orderId: currentOrder.id,
        status: status,
        courierId: user.id,
      });

      if (status === 'delivered') {
        Alert.alert('Успех', 'Заказ доставлен!');
        setCurrentOrder(null);
        setRoute([]);
      }
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось обновить статус');
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {currentOrder ? (
        <>
          {/* Карта */}
          <View style={{ flex: 2 }}>
            {location && (
              <MapView
                style={{ flex: 1 }}
                initialRegion={{
                  latitude: location.latitude,
                  longitude: location.longitude,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
              >
                {/* Местоположение курьера */}
                <Marker
                  coordinate={{
                    latitude: location.latitude,
                    longitude: location.longitude,
                  }}
                  title='Вы'
                  pinColor='blue'
                />

                {/* Темный магазин */}
                <Marker
                  coordinate={currentOrder.darkStore.coordinates}
                  title='Магазин'
                  pinColor='green'
                />

                {/* Адрес доставки */}
                <Marker
                  coordinate={currentOrder.deliveryAddress.coordinates}
                  title='Доставка'
                  pinColor='red'
                />

                {/* Маршрут */}
                {route.length > 1 && (
                  <Polyline
                    coordinates={route}
                    strokeColor='#3b82f6'
                    strokeWidth={3}
                  />
                )}
              </MapView>
            )}
          </View>

          {/* Информация о заказе */}
          <View style={{ padding: 16, backgroundColor: 'white' }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 8 }}>
              Заказ #{currentOrder.id}
            </Text>

            <View style={{ marginBottom: 16 }}>
              <Text>🛒 {currentOrder.items.length} товаров</Text>
              <Text>📍 {currentOrder.deliveryAddress.address}</Text>
              <Text>📞 {currentOrder.phone}</Text>
              {currentOrder.comment && <Text>💬 {currentOrder.comment}</Text>}
            </View>

            {/* Кнопки действий */}
            <View
              style={{ flexDirection: 'row', justifyContent: 'space-between' }}
            >
              <TouchableOpacity
                onPress={() => updateOrderStatus('picked_up')}
                style={{
                  backgroundColor: '#3b82f6',
                  padding: 12,
                  borderRadius: 8,
                  flex: 1,
                  marginRight: 8,
                }}
              >
                <Text style={{ color: 'white', textAlign: 'center' }}>
                  🛍 Забрал заказ
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => updateOrderStatus('delivering')}
                style={{
                  backgroundColor: '#f59e0b',
                  padding: 12,
                  borderRadius: 8,
                  flex: 1,
                  marginHorizontal: 8,
                }}
              >
                <Text style={{ color: 'white', textAlign: 'center' }}>
                  🚴 В пути
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => updateOrderStatus('delivered')}
                style={{
                  backgroundColor: '#10b981',
                  padding: 12,
                  borderRadius: 8,
                  flex: 1,
                  marginLeft: 8,
                }}
              >
                <Text style={{ color: 'white', textAlign: 'center' }}>
                  ✅ Доставлено
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </>
      ) : (
        <View
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
        >
          <Text style={{ fontSize: 18, marginBottom: 16 }}>
            Нет активных заказов
          </Text>
          <TouchableOpacity
            onPress={fetchCurrentOrder}
            style={{
              backgroundColor: '#3b82f6',
              padding: 16,
              borderRadius: 8,
            }}
          >
            <Text style={{ color: 'white', fontSize: 16 }}>
              🔍 Проверить новые заказы
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default CourierApp;
