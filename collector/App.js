import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useSocket } from './hooks/useSocket';
import { scanBarcode } from './utils/barcodeScanner';

const OrderPickerApp = () => {
  const [currentOrder, setCurrentOrder] = useState(null);
  const [pickedItems, setPickedItems] = useState([]);
  const socket = useSocket();

  // Получаем новый заказ для сборки
  const fetchNewOrder = async () => {
    try {
      const response = await fetch(`${API_URL}/api/picker/next-order`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const order = await response.json();
      setCurrentOrder(order);
      setPickedItems([]);
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось получить заказ');
    }
  };

  // Сканирование товара
  const handleScan = async () => {
    const barcode = await scanBarcode();
    if (!barcode) return;

    // Находим товар в заказе
    const orderItem = currentOrder.items.find(
      (item) => item.product.barcode === barcode
    );

    if (orderItem) {
      setPickedItems((prev) => [
        ...prev,
        {
          ...orderItem,
          scannedAt: new Date(),
        },
      ]);

      // Отправляем на сервер
      socket.emit('item-scanned', {
        orderId: currentOrder.id,
        productId: orderItem.product.id,
        pickerId: user.id,
      });
    } else {
      Alert.alert('Ошибка', 'Товар не найден в заказе');
    }
  };

  // Завершить сборку
  const completePicking = async () => {
    const allPicked = currentOrder.items.every((orderItem) =>
      pickedItems.some((picked) => picked.product.id === orderItem.product.id)
    );

    if (!allPicked) {
      Alert.alert('Внимание', 'Не все товары собраны');
      return;
    }

    try {
      await fetch(`${API_URL}/api/picker/complete-order`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          orderId: currentOrder.id,
          pickerId: user.id,
          pickingTime: Math.floor(
            (Date.now() - new Date(currentOrder.assignedAt)) / 60000
          ),
        }),
      });

      Alert.alert('Успех', 'Заказ собран и передан курьеру');
      fetchNewOrder();
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось завершить сборку');
    }
  };

  return (
    <View style={{ flex: 1, padding: 16 }}>
      {currentOrder ? (
        <>
          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold' }}>
              Заказ #{currentOrder.id}
            </Text>
            <Text>Адрес: {currentOrder.deliveryAddress}</Text>
            <Text>Время: {currentOrder.deliveryTime}</Text>
          </View>

          <FlatList
            data={currentOrder.items}
            keyExtractor={(item) => item.product.id.toString()}
            renderItem={({ item }) => {
              const isPicked = pickedItems.some(
                (picked) => picked.product.id === item.product.id
              );

              return (
                <View
                  style={{
                    flexDirection: 'row',
                    padding: 12,
                    backgroundColor: isPicked ? '#d1fae5' : '#f3f4f6',
                    marginBottom: 8,
                    borderRadius: 8,
                  }}
                >
                  <Text style={{ flex: 1 }}>{item.product.name}</Text>
                  <Text>x{item.quantity}</Text>
                  <Text style={{ marginLeft: 8, width: 60 }}>
                    {item.product.storageLocation}
                  </Text>
                  {isPicked && <Text>✅</Text>}
                </View>
              );
            }}
          />

          <View style={{ marginTop: 16 }}>
            <TouchableOpacity
              onPress={handleScan}
              style={{
                backgroundColor: '#3b82f6',
                padding: 16,
                borderRadius: 8,
                alignItems: 'center',
                marginBottom: 8,
              }}
            >
              <Text style={{ color: 'white', fontSize: 16 }}>
                📦 Сканировать товар
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={completePicking}
              style={{
                backgroundColor: '#10b981',
                padding: 16,
                borderRadius: 8,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: 'white', fontSize: 16 }}>
                ✅ Завершить сборку
              </Text>
            </TouchableOpacity>
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
            onPress={fetchNewOrder}
            style={{
              backgroundColor: '#3b82f6',
              padding: 16,
              borderRadius: 8,
            }}
          >
            <Text style={{ color: 'white', fontSize: 16 }}>
              🔍 Найти новый заказ
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default OrderPickerApp;
