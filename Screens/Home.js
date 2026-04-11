import { View, Text } from 'react-native'
import React from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import MyAccount from './Home/MyAccount';
import ListAccount from './Home/ListAccount';
import Groupe from './Home/Groupe';


const Tab=createBottomTabNavigator();

export default function Home() {
  return (
    <Tab.Navigator>
        <Tab.Screen name='MyAccount' component={MyAccount}/>
        <Tab.Screen name='ListAccount' component={ListAccount}/>
        <Tab.Screen name='Groupe' component={Groupe}/>
    </Tab.Navigator>
  )
}