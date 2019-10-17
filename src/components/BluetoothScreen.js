import React, {Component} from 'react';
import {Alert, FlatList, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View} from 'react-native';
import BleModule from './BleModule';
import {AreaChart, Grid, LineChart} from 'react-native-svg-charts';
import * as shape from 'd3-shape'

global.BluetoothManager = new BleModule();

//记得要在手机权限里面打开 定位
export default class BluetoothScreen extends Component{
    constructor(props) {
        super(props);
        this.state={
            data: [],
            scaning:false,
            reading:false,
            isConnected:false,
            text:'',
            writeData:'',
            receiveData:'',
            readData:'',
            isMonitoring:false,
            clear:false,
            test_data:[50, 10, 40, 95, -4, -24, 85, 91, 35, 53, -53, 24, 50, -20, -80],
            formData:[0,0,0],
            isCharging:0,
        }
        this.bluetoothReceiveData = [];  //蓝牙接收的数据缓存
        this.formDataBuffer = [];
        this.writeBuffer='';
        this.deviceMap = new Map();
        this.date=new Date().getTime();

        this.RNFS = require('react-native-fs');
        this.filename= 'ECG_record_'+this.date+'.txt';
        this.path = this.RNFS.ExternalStorageDirectoryPath + '/ECG/'+this.filename;



        //console.log(path);
        this.writeFile(this.date+'\n',this.path);
    }

    writeFile(data,path)
    {
        this.RNFS.writeFile(path, data, 'utf8')
            .then((success) => {
                console.log('FILE WRITTEN!');
            })
            .catch((err) => {
                console.log(err.message);
            });
    }

    appendFile(data,path)
    {
        this.RNFS.appendFile(path, data, 'utf8')
            .then((success) => {
                console.log(data.length+' CHAR HAVE '+' APPEND!');
                this.writeBuffer='';
            })
            .catch((err) => {
                console.log(err.message);
            });
    }

    readFile(path)
    {
        this.RNFS.readFile(path, 'utf8')
            .then((contents)=>{
                this.data=contents;
                console.log(this.data);
            })
            .catch((err)=>{
                console.log(err.message,err.code);
            });
    }

    componentDidMount(){
        BluetoothManager.start();  //蓝牙初始化
        this.updateStateListener = BluetoothManager.addListener('BleManagerDidUpdateState',this.handleUpdateState);
        this.stopScanListener = BluetoothManager.addListener('BleManagerStopScan',this.handleStopScan);
        this.discoverPeripheralListener = BluetoothManager.addListener('BleManagerDiscoverPeripheral',this.handleDiscoverPeripheral);
        this.connectPeripheralListener = BluetoothManager.addListener('BleManagerConnectPeripheral',this.handleConnectPeripheral);
        this.disconnectPeripheralListener = BluetoothManager.addListener('BleManagerDisconnectPeripheral',this.handleDisconnectPeripheral);
        this.updateValueListener = BluetoothManager.addListener('BleManagerDidUpdateValueForCharacteristic', this.handleUpdateValue);
    }

    componentWillUnmount(){
        this.updateStateListener.remove();
        this.stopScanListener.remove();
        this.discoverPeripheralListener.remove();
        this.connectPeripheralListener.remove();
        this.disconnectPeripheralListener.remove();
        this.updateValueListener.remove();
        if(this.state.isConnected){
            BluetoothManager.disconnect();  //退出时断开蓝牙连接
        }
    }

    //蓝牙状态改变
    handleUpdateState=(args)=>{
        console.log('BleManagerDidUpdateStatea:', args);
        BluetoothManager.bluetoothState = args.state;
        if(args.state == 'on'){  //蓝牙打开时自动搜索
            this.scan();
        }
    }

    //扫描结束监听
    handleStopScan=()=>{
        console.log('BleManagerStopScan:','Scanning is stopped');
        this.setState({scaning:false});
    }

    //搜索到一个新设备监听
    handleDiscoverPeripheral=(data)=>{
        // console.log('BleManagerDiscoverPeripheral:', data);
        console.log(data.id,data.name);
        let id;  //蓝牙连接id
        let macAddress;  //蓝牙Mac地址
        if(Platform.OS == 'android'){
            macAddress = data.id;
            id = macAddress;
        }else{
            //ios连接时不需要用到Mac地址，但跨平台识别同一设备时需要Mac地址
            //如果广播携带有Mac地址，ios可通过广播0x18获取蓝牙Mac地址，
            macAddress = BluetoothManager.getMacAddressFromIOS(data);
            id = data.id;
        }
        this.deviceMap.set(data.id,data);  //使用Map类型保存搜索到的蓝牙设备，确保列表不显示重复的设备
        this.setState({data:[...this.deviceMap.values()]});
    }

    //蓝牙设备已连接
    handleConnectPeripheral=(args)=>{
        console.log('BleManagerConnectPeripheral:', args);
    }

    //蓝牙设备已断开连接
    handleDisconnectPeripheral=(args)=>{
        console.log('BleManagerDisconnectPeripheral:', args);
        let newData = [...this.deviceMap.values()]
        BluetoothManager.initUUID();  //断开连接后清空UUID
        this.setState({
            data:newData,
            isConnected:false,
            writeData:'',
            readData:'',
            receiveData:'',
            text:'',
        });
    }

    //接收到新数据
    handleUpdateValue=(data)=>{
        if(!this.state.isMonitoring) return;
        //ios接收到的是小写的16进制，android接收的是大写的16进制，统一转化为大写16进制
        let value = data.value;
        //this.bluetoothReceiveData.push(value);
        //this.appendFile(this.bluetoothReceiveData,this.path);
        //this.appendFile('11111 ',this.path);

        switch(value[2]){
            case 1:
                //charing mode v[0]-v[8]
                console.log('charging!');
                if(value[3]==0)
                    this.setState({isCharging:1});
                else if(value[3]==1)
                    this.setState({isCharging:0});

                let uint16=(value[5] << 8) | value[4];
                //console.log(uint16);
                break;
            case 2:
                //running mode v[0]-v[19] * 2
                //console.log('receive running package');
                for(let i=3;i<19;i+=2)
                {
                    let uint16=(value[i] << 8) + value[i+1];
                    if(uint16!=undefined)
                    {
                        this.formDataBuffer.push(uint16);
                        //this.setState({formData:this.formDataBuffer});
                        //this.appendFile((uint16+" "),this.path);
                        this.writeBuffer+=(uint16+' ');
                    }
                }

                break;
            case 3:
                //console.log('receive battery package');
                //battery package v[0]-v[19]
                break;
            default:
                for(let i=1;i<15;i+=2)
                {
                    let uint16=(value[i] << 8) + value[i+1];
                    if(uint16!=undefined)
                    {
                        this.formDataBuffer.push(uint16);
                        //this.setState({formData:this.formDataBuffer});
                        //this.appendFile((uint16+" "),this.path);
                        this.writeBuffer+=(uint16+' ');
                    }
                }
        }

        if(this.formDataBuffer.length>1000)
        {
            //this.formDataBuffer.splice(0, 17);
            this.setState({formData:this.formDataBuffer});
            this.formDataBuffer=[];
            console.log('this file\'s length is '+this.writeBuffer.length);
            this.appendFile(this.writeBuffer,this.path);
        }



        // if(this.state.receiveData.length>1000)
        // {
        //     this.bluetoothReceiveData=[];
        //     this.setState({receiveData:''});
        // }


        //this.setState({formData:this.formDataBuffer});
        //this.setState({receiveData:this.bluetoothReceiveData.join('\n')})
    }

    connect(item){
        //当前蓝牙正在连接时不能打开另一个连接进程
        if(BluetoothManager.isConnecting){
            console.log('当前蓝牙正在连接时不能打开另一个连接进程');
            return;
        }
        if(this.state.scaning){  //当前正在扫描中，连接时关闭扫描
            BluetoothManager.stopScan();
            this.setState({scaning:false});
        }
        let newData = [...this.deviceMap.values()]
        newData[item.index].isConnecting = true;
        this.setState({data:newData});

        BluetoothManager.connect(item.item.id)
            .then(peripheralInfo=>{
                let newData = [...this.state.data];
                newData[item.index].isConnecting = false;
                //连接成功，列表只显示已连接的设备
                this.setState({
                    data:[item.item],
                    isConnected:true
                });
            })
            .catch(err=>{
                let newData = [...this.state.data];
                newData[item.index].isConnecting = false;
                this.setState({data:newData});
                this.alert('连接失败');
            })
    }

    disconnect(){
        this.setState({
            data:[...this.deviceMap.values()],
            isConnected:false
        });
        BluetoothManager.disconnect();
    }

    scan(){
        if(this.state.scaning){  //当前正在扫描中
            BluetoothManager.stopScan();
            this.setState({scaning:false});
        }
        if(BluetoothManager.bluetoothState == 'on'){
            BluetoothManager.scan()
                .then(()=>{
                    this.setState({ scaning:true });
                }).catch(err=>{

            })
        }else{
            BluetoothManager.checkState();
            if(Platform.OS == 'ios'){
                this.alert('请开启手机蓝牙');
            }else{
                Alert.alert('提示','请开启手机蓝牙',[
                    {
                        text:'取消',
                        onPress:()=>{ }
                    },
                    {
                        text:'打开',
                        onPress:()=>{ BluetoothManager.enableBluetooth() }
                    }
                ]);
            }

        }
    }

    alert(text){
        Alert.alert('提示',text,[{ text:'确定',onPress:()=>{ } }]);
    }

    write=(index)=>{
        if(this.state.text.length == 0){
            this.alert('请输入消息');
            return;
        }
        BluetoothManager.write(this.state.text,index)
            .then(()=>{
                this.bluetoothReceiveData = [];
                this.setState({
                    writeData:this.state.text,
                    text:'',
                })
            })
            .catch(err=>{
                this.alert('发送失败');
            })
    }

    writeWithoutResponse=(index)=>{
        if(this.state.text.length == 0){
            this.alert('请输入消息');
            return;
        }
        BluetoothManager.writeWithoutResponse(this.state.text,index)
            .then(()=>{
                this.bluetoothReceiveData = [];
                this.setState({
                    writeData:this.state.text,
                    text:'',
                })
            })
            .catch(err=>{
                this.alert('发送失败');
            })
    }

    read=(index)=>{
        BluetoothManager.read(index)
            .then(data=>{
                this.setState({readData:data});
            })
            .catch(err=>{
                this.alert('读取失败');
            })
    }

    notify=(index)=>{
        BluetoothManager.startNotification(index)
            .then(()=>{
                this.setState({isMonitoring:true});
                this.alert('开启成功');
            })
            .catch(err=>{
                this.setState({isMonitoring:false});
                this.alert('开启失败');
            })

    }

    disnotify=(index)=>{
        console.log('trying disnotify');
        this.setState({isMonitoring:false});
        this.setState({
            receiveData:'',
        });
        this.bluetoothReceiveData=[];
        try{
            BluetoothManager.stopNotification(index);
        } catch (e) {
            console.log(e);
        }


    }

    renderItem=(item)=>{
        let data = item.item;
        if(!data.name) return null;
        else {
            return(
                <TouchableOpacity
                    activeOpacity={0.7}
                    disabled={this.state.isConnected?true:false}
                    onPress={()=>{this.connect(item)}}
                    style={styles.item}>

                    <View style={{flexDirection:'row',}}>
                        <Text style={{color:'black'}}>{data.name?data.name:''}</Text>
                        <Text style={{marginLeft:50,color:"red"}}>{data.isConnecting?'连接中...':''}</Text>
                    </View>
                    <Text>{data.id}</Text>

                </TouchableOpacity>
            );
        }
    }

    renderHeader=()=>{
        return(
            <View style={{marginTop:20}}>
                <TouchableOpacity
                    activeOpacity={0.7}
                    style={[styles.buttonView,{marginHorizontal:10,marginVertical:10,height:40,alignItems:'center'}]}
                    onPress={this.state.isConnected?this.disconnect.bind(this):this.scan.bind(this)}>
                    <Text style={styles.buttonText}>{this.state.scaning?'正在搜索中':this.state.isConnected?'断开蓝牙':'搜索蓝牙'}</Text>
                </TouchableOpacity>

                <Text style={{marginLeft:10,marginTop:10}}>
                    {this.state.isConnected?'当前连接的设备':'可用设备'}
                </Text>
            </View>
        )
    }

    renderFooter=()=>{
        return(
            <View style={{marginBottom:30}}>
                {this.state.isConnected?
                    <View style={{
                        flex: 1,
                        justifyContent: 'center',
                    }}>
                        <View>
                            <Text>{this.state.isCharging==0?'已充满':'正在充电'}</Text>
                        </View>
                        {/*<AreaChart*/}
                            {/*style={{ height: 200, margin:10}}*/}
                            {/*data={this.state.formData}*/}
                            {/*contentInset={{ top: 30, bottom: 30 }}*/}
                            {/*curve={shape.curveNatural}*/}
                            {/*svg={{ fill: 'rgba(134, 65, 244, 0.8)' }}*/}
                        {/*>*/}
                            {/*<Grid />*/}
                        {/*</AreaChart>*/}
                        <LineChart
                            style={{ height:500,margin:10 }}
                            data={this.state.formData}
                            svg={{ stroke: 'rgba(134, 65, 244, 0.8)' }}
                            contentInset={{ top: 30, bottom: 30 }}
                        >
                            <Grid />
                        </LineChart>
                        {this.renderReceiveView('通知监听接收的数据：'+`${this.state.isMonitoring?'监听已开启':'监听未开启'}`,`${this.state.isMonitoring?'关闭监听':'开启监听'}`,BluetoothManager.nofityCharacteristicUUID,this.state.isMonitoring?this.disnotify:this.notify,this.state.isMonitoring?'Monitoring':'Not Monitoring')}
                    </View>

                    :
                    <View></View>
                }
            </View>
        )
    }

    renderReceiveView=(label,buttonText,characteristics,onPress,state)=>{
        if(characteristics.length == 0){
            return;
        }

        return(
            <View style={{marginHorizontal:10,marginTop:30}}>
                <Text style={{color:'black',marginTop:5}}>{label}</Text>
                <Text style={styles.content}>
                    {state}
                </Text>
                {characteristics.map((item,index)=>{
                    return(
                        <TouchableOpacity
                            activeOpacity={0.7}
                            style={styles.buttonView}
                            onPress={()=>{onPress(index)}}
                            key={index}>
                            <Text style={styles.buttonText}>{buttonText} ({item})</Text>
                        </TouchableOpacity>
                    )
                })}
            </View>
        )
    }

    render () {

        return (
            <View style={styles.container}>
                <FlatList
                    renderItem={this.renderItem}
                    ListHeaderComponent={this.renderHeader}
                    ListFooterComponent={this.renderFooter}
                    keyExtractor={item=>item.id}
                    data={this.state.data}
                    extraData={[this.state.isConnected,this.state.text,this.state.receiveData,this.state.readData,this.state.writeData,this.state.isMonitoring,this.state.scaning]}
                    keyboardShouldPersistTaps='handled'
                />
            </View>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
    },
    ImageContainer: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
    },
    buttonContainer: {
        margin: 20,
    },
    alternativeLayoutButtonContainer: {
        margin: 20,
        flexDirection: 'row',
        justifyContent: 'space-between'
    },
    biggerfont: {
        fontSize: 20,
        color: '#FF69B4',
        fontWeight: 'bold',
        textAlign: 'center',
        margin: 20,
    },
    simpleImage: {
        flex: 1,
    },
    item: {
        flexDirection: 'column',
        borderColor: 'rgb(235,235,235)',
        borderStyle: 'solid',
        borderBottomWidth: StyleSheet.hairlineWidth,
        paddingLeft: 10,
        paddingVertical: 8,
    },
    buttonView: {
        height: 30,
        backgroundColor: 'rgb(33, 150, 243)',
        paddingHorizontal: 10,
        borderRadius: 5,
        justifyContent: "center",
        alignItems: 'center',
        marginTop: 10
    },
    buttonText: {
        color: "white",
        fontSize: 12,
    },
    content: {
        marginTop: 5,
        marginBottom: 15,
    },
    textInput: {
        paddingLeft: 5,
        paddingRight: 5,
        backgroundColor: 'white',
        height: 50,
        fontSize: 16,
        flex: 1,
    },

})
