import { View, Text } from 'react-native'
import React from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import MyAccount from './Home/MyAccount';
import ListAccount from './Home/ListAccount';
import Groupe from './Home/Groupe';


const Tab=createBottomTabNavigator();
//ay page b3athnalha les données njibouha b props


export default function Home(props) {
  const userid=props.route.params.userid;
  return (
    <Tab.Navigator screenOptions={{headerShown: false}}>
        <Tab.Screen name='MyAccount' component={MyAccount} initialParams={{userid: userid}}/>
        <Tab.Screen name='ListAccount' component={ListAccount} initialParams={{userid: userid}}/>
        <Tab.Screen name='Groupe' component={Groupe}/>
    </Tab.Navigator>
  )
}