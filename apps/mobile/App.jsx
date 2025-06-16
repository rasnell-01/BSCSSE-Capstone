import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import axios from 'axios';

export default function App() {
    const [message, setMessage] = useState('');

    useEffect(() => {
        axios.get('http://localhost:5000/') // Replace with your local IP on device
            .then(res => setMessage(res.data))
            .catch(err => console.error(err));
    }, []);

    return (
        <View>
            <Text>{message}</Text>
        </View>
    );
}
