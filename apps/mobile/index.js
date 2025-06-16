import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomePage from './HomePage';
import AddItem from './AddItem';
import EditItem from './EditItem';

const Stack = createNativeStackNavigator();

export default function App() {
    return (
        <NavigationContainer>
            <Stack.Navigator id="MainStack">
                <Stack.Screen name="HomePage" component={HomePage} />
                <Stack.Screen name="AddItem" component={AddItem} />
                <Stack.Screen name="EditItem" component={EditItem} />
            </Stack.Navigator>
        </NavigationContainer>
    );
}
