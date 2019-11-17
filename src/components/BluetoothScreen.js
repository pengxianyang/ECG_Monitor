import React, {Component} from 'react';
import {
    Alert,
    FlatList,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    ART,
    Dimensions, Image,
} from 'react-native';
import BleModule from './BleModule';
import {AreaChart, Grid, LineChart, PieChart, YAxis} from 'react-native-svg-charts';
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
            heartRateData:[0,0,0],
            heartRate:0,
            isCharging:0,
            path:ART.Path(),
        }

        this.screenWidth = Math.round(Dimensions.get('window').width);
        this.packageCount=0;

        this.bluetoothReceiveData = [];  //蓝牙接收的数据缓存
        this.formDataBuffer = [];
        this.formDataYAxis=[-100000,-5000,0,5000,100000];
        this.packageFromBuffer=[];
        this.writeBuffer='';
        this.packageWriteBuffer='';
        this.signalQulity=true;
        this.deviceMap = new Map();
        this.date=new Date().getTime();
        this.vaildDataNum=0;
        this.unvaildDataNum=0;
        this.breakDigit=0;

        this.heartRateBuffer=[];
        this.heartRateYAxis=[0,20,40,60,80,100,120,140];

        this.RNFS = require('react-native-fs');
        this.filename= 'ECG_record_'+this.date+'.txt';
        this.path = this.RNFS.ExternalStorageDirectoryPath + '/ECG/'+this.filename;

        //console.log(path);
        this.writeFile(this.date+'\n',this.path);


        //console.log(((255 & 0xFFFFFF)<<8) | (1 & 0xFFFFFF));

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
                //console.log(data.length+' CHAR HAVE '+' APPEND!');
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

        // console.log(value);
        if(value[2]===1&&value[0]===170&&value[1]===170)
        {
            console.log(value);
            //charing mode v[0]-v[8]
            // console.log('charging!');
            if(value[3]===0)
                this.setState({isCharging:1});
            else if(value[3]===1)
                this.setState({isCharging:0});

            let uint16=(value[4] << 8) | value[5];
            //console.log("charging state is: "+value[3]+" ADC reading: "+uint16+' package size is '+value.length);
        }
        else if(value[2]===2&&value[0]===170&&value[1]===170)
        {
            //running mode v[0]-v[19] * 2
            //console.log('receive running package '+value.length);
            for(let i=3;i<19;i+=2)
            {
                //let uint16=(value[i] << 8) + value[i+1];
                let uint16=(((value[i] & 0xFFFFFF) << 8) | (value[i+1] & 0xFFFFFF));
                if(uint16!==undefined)
                {
                    // this.formDataBuffer.push(uint16);
                    // this.writeBuffer+=(uint16+' ');
                    if(uint16>50000)
                        uint16=(uint16-65280)+300;
                    else
                        uint16+=300;
                    this.packageWriteBuffer+=(uint16+' ');
                    this.packageFromBuffer.push(uint16);
                }
            }
            this.breakDigit=value[19];
            //this.packageFromBuffer.push((value[19] & 0xFF) << 8);
        }
        else if(value[2]===3&&value[0]===170&&value[1]===170)
        {
            //battery package v[0]-v[19]

            if(value[6]<100)
                this.signalQulity=false;
            else
                this.signalQulity=true;

            let batt=(value[3] << 8) | value[4];
            //console.log("heart rate: "+value[5]+" signal quality: "+value[6]+"battery: "+batt);

            if(this.signalQulity)
            {
                this.heartRateBuffer.push(value[5]);
                this.setState({
                    heartRateData:this.heartRateBuffer,
                    heartRate:this.heartRateBuffer[this.heartRateBuffer.length-1],
                });
            }
        }
        else if(value[0]!==170&&value[1]!==170)
        {
            let t=(((this.breakDigit & 0xFFFFFF) << 8) | (value[0] & 0xFFFFFF));
            if(t>50000)
                t=(t-65280)+300;
            else
                t+=300;
            this.packageWriteBuffer+=(t+' ');
            this.packageFromBuffer.push(t);

            for(let i=1;i<15;i+=2)
            {
                //let uint16=(value[i] << 8) + value[i+1];
                let uint16=(((value[i] & 0xFFFFFF) << 8) | (value[i+1] & 0xFFFFFF));
                if(uint16!==undefined)
                {
                    // this.formDataBuffer.push(uint16);
                    // this.writeBuffer+=(uint16+' ');
                    if(uint16>50000)
                        uint16=(uint16-65280)+300;
                    else
                        uint16+=300;
                    this.packageWriteBuffer+=(uint16+' ');
                    this.packageFromBuffer.push(uint16);
                }
            }

            //check error
            if(value[15]===0&&value[16]===0&&this.signalQulity)
            {
                this.packageCount++;
                //this.vaildDataNum++;
                //console.log('no error '+this.formDataBuffer.length+" "+this.writeBuffer.length+" "+this.packageFromBuffer.length);
                this.formDataBuffer.push.apply(this.formDataBuffer, this.packageFromBuffer);
                this.writeBuffer+=this.packageWriteBuffer;
            }

            this.packageWriteBuffer="";
            this.packageFromBuffer=[];
        }

        if(this.packageCount%4===0)
        {
            this.addPoint();
            this.packageCount=0;
        }

        if(this.formDataBuffer.length>this.screenWidth*5)
        {
            //this.clearSurface();
            //console.log('this file\'s length is '+this.writeBuffer.length);
            this.appendFile(this.writeBuffer,this.path);
            this.formDataBuffer=[];
        }

        if(this.heartRateBuffer.length>60)
        {
            this.heartRateBuffer=[];
            this.setState({heartRateData:this.heartRateBuffer});
        }

    }

    addPoint()
    {
        let tpath=new ART.Path();
        tpath.moveTo(0,0);
        for(let i=0;i<this.formDataBuffer.length;i++)
        {
            tpath.lineTo(i/5, this.formDataBuffer[i]/60+100)
                .moveTo(i/5, this.formDataBuffer[i]/60+100);
        }

        this.setState({path:tpath});
    }

    clearSurface()
    {
        let tpath=new ART.Path();
        this.setState({path:tpath});
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
        const display = this.state.isConnected ? "none" : "flex";
        if(!data.name) return null;
        else {
            return(
                <View style={{backgroundColor:'indigo'}}>

                    <TouchableOpacity
                        style={[{display},{ flex:1, backgroundColor:'plum',margin:5,shadowOffset:{width:10,height:10},shadowColor:'black',shadowOpacity:0.25,shadowRadius:3.84,elevation: 5,borderRadius:8.0}]}
                        onPress={()=>{
                            this.connect(item)
                        }}
                        disabled={this.state.isConnected?true:false}
                    >
                        <View style={{flex:1,flexDirection:'row',padding:10,backgroundColor:'blueviolet'}}>
                            <Text style={{fontSize:15,color:'white',marginTop:0}}>{data.name?data.name:''}</Text>
                        </View>
                        <View style={{flex:1,flexDirection:'row',padding:10}}>
                            <View style={{flex:1}}>
                                <Image style={{height:60,width:60,resizeMode: 'contain',}} source={require('../../res/Image/logo_device.png')}/>
                            </View>
                            <View style={{flex:5,marginStart:10}}>
                                <View style={{flex:1}}>
                                    <Text style={{fontSize:16,color:'white',marginTop:0}}>{'MAC Address:'}</Text>
                                </View>
                                <View style={{flex:1 , flexDirection:'row'}}>
                                    <Text style={{fontSize:16,color:'white',marginTop:0,}}>{data.id}</Text>
                                    <Text style={{fontSize:16,color:'red',marginTop:0,marginStart:20}}>{data.isConnecting?'Connecting':''}</Text>
                                </View>
                            </View>
                        </View>
                    </TouchableOpacity>
                </View>
            );
        }
    }

    renderHeader=()=>{
        return(
            <View style={{backgroundColor:'indigo`',marginTop:10}}>
                <TouchableOpacity
                    style={{ height:50, backgroundColor:'plum',marginStart:30,marginRight:30,marginTop:10,marginBottom:10,padding:3,shadowOffset:{width:10,height:10},shadowColor:'black',shadowOpacity:0.25,shadowRadius:3.84,elevation: 5,borderRadius:8.0}}
                    onPress={this.state.isConnected?this.disconnect.bind(this):this.scan.bind(this)}
                >
                    <View style={{flex:1,flexDirection:'row'}}>
                        <Text style={{flex:1,fontSize:20,color:'white',marginTop:0,textAlign:'center',  textAlignVertical:'center',}}>{this.state.scaning?'SEARCHING':this.state.isConnected?'DISCONNECT':'SEARCH DEVICE'}</Text>
                    </View>
                </TouchableOpacity>
            </View>
        )
    }

    renderFooter=()=>{
        let index=-1;
        BluetoothManager.nofityCharacteristicUUID.map((item,tindex)=>{index=tindex});

        return(
            <View style={{marginBottom:30,backgroundColor:'white',}}>
                {this.state.isConnected?
                    <View style={{flex: 1}}>
                        <View style={{backgroundColor:'indigo'}}>

                            <View style={{height:160,backgroundColor:'indigo'}}>
                                <View style={{height:100,backgroundColor:'indigo',flexDirection:'row',justifyContent:'center',}}>
                                    <View style={{height:100}}>
                                        <Image style={{height:60,width:60,resizeMode: 'contain',marginTop:20,}} source={require('../../res/Image/logo_ECG.png')}/>
                                    </View>
                                    <Text style={{height:100,color:'white',textAlign:'center',marginTop:15,marginStart:10,fontSize:55,fontWeight: 'bold'}}>{this.state.heartRate}</Text>
                                    <Text style={{height:100,color:'white',textAlign:'center',marginTop:50,marginStart:10,fontSize:20,fontWeight: 'bold'}}>BPM Average</Text>
                                </View>
                                <View style={{height:60,backgroundColor:'indigo',flexDirection:'row',justifyContent:'center',}}>
                                    <View style={{height:60}}>
                                        <Image style={{height:40,width:40,resizeMode: 'contain',marginTop:10,}} source={require('../../res/Image/logo_battery.png')}/>
                                    </View>
                                    <Text style={{height:60,color:'white',textAlign:'center',marginTop:18,marginStart:10,fontSize:18,fontWeight: 'bold'}}>100%</Text>
                                    <View style={{height:60,marginStart:40}}>
                                        <Image style={{height:40,width:40,resizeMode: 'contain',marginTop:10,}} source={require('../../res/Image/logo_ECG_signal.png')}/>
                                    </View>
                                    <Text style={{height:60,color:'white',textAlign:'center',marginTop:18,marginStart:10,fontSize:18,fontWeight: 'bold'}}>{this.signalQulity?'GOOD':"BAD"}</Text>
                                </View>
                            </View>

                            <View style={{backgroundColor:'indigo'}}>
                                <TouchableOpacity
                                    style={{ height:50,backgroundColor:'orange',marginStart:30,marginRight:30,marginTop:10,marginBottom:10,padding:3,shadowOffset:{width:10,height:10},shadowColor:'black',shadowOpacity:0.25,shadowRadius:3.84,elevation: 5,borderRadius:8.0}}
                                    onPress={()=>this.state.isMonitoring?this.disnotify(index):this.notify(index)}
                                >
                                    <View style={{flex:1,flexDirection:'row'}}>
                                        <Text style={{flex:1,fontSize:20,color:'white',marginTop:0,textAlign:'center',  textAlignVertical:'center',}}>{this.state.isMonitoring?'STOP':'START'}</Text>
                                    </View>
                                </TouchableOpacity>
                            </View>

                        </View>
                        <View style={{backgroundColor:'indigo'}}>
                            <ART.Surface width={this.screenWidth} height={500}>
                                <ART.Shape d={this.state.path} stroke="#7CFC00" strokeWidth={2} />
                            </ART.Surface>
                        </View>
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
            <View style={{flex:1,backgroundColor:'indigo'}}>
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
