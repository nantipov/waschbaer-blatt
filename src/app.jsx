import React, {Component} from "react";
import {CartesianGrid, Legend, Line, LineChart, ReferenceLine, XAxis, YAxis} from "recharts";
import DateTime from "react-datetime";
import 'react-datetime/css/react-datetime.css';
import "style.css";

export default class App extends Component {
    constructor(props) {
        super(props);
        this.state = {
            chartStartTime: null,
            chartEndTime: null,
            error: null,
            isLoaded: false,
            items: [],
            sensorReadings: [],
            wateringForced: false
        };
        this.applyChartStartTime = this.applyChartStartTime.bind(this);
        this.applyChartEndTime = this.applyChartEndTime.bind(this);
        this.forceWatering = this.forceWatering.bind(this);
    }

    componentDidMount() {
        this.readData();
    }

    applyChartStartTime(chartStartTime) {
        console.log(chartStartTime);
        this.setState({
            chartStartTime: chartStartTime,
        });
        this.readData();
    }

    applyChartEndTime(chartEndTime) {
        console.log(chartEndTime);
        this.setState({
            chartEndTime: chartEndTime
        });
        this.readData();
    }

    static dateToNumber(date) {
        return Date.parse(date);
    }

    static numberToDate(number) {
        return new Date(number).toString();
    }

    readData() {
        const url = '/api/events?start_time=' + this.state.chartStartTime + '&end_time=' + this.state.chartEndTime;
        fetch(url)
            .then(resp => resp.json())
            .then((data) => {
                let readings = [];
                let previousSensorValues = {};
                data.items.forEach(item => {
                    if (item.type === 'READING') {
                        let reading = {};
                        reading.occurred_at = item.occurred_at;
                        for (let prevSensorValueKey in previousSensorValues) {
                            reading[prevSensorValueKey] = previousSensorValues[prevSensorValueKey];
                        }
                        let y = 0;
                        let avg = 0;
                        item.data.event_data.sensors.forEach(sensor => {
                            reading[sensor.name] = sensor.value;
                            y = Math.max(y, sensor.value);
                            previousSensorValues[sensor.name] = reading[sensor.name];
                        });
                        let avgCounter = 0;
                        for (let prevSensorValueKey in previousSensorValues) {
                            avg += previousSensorValues[prevSensorValueKey];
                            avgCounter++;
                        }
                        avg /= avgCounter;
                        reading.y = y;
                        reading.avg = avg;
                        reading.occurred_at_numeric = App.dateToNumber(reading.occurred_at);
                        readings.push(reading);
                    }

                    if (item.type === 'ACTION') {
                        readings.push({
                            occurred_at: item.occurred_at,
                            occurred_at_numeric: App.dateToNumber(item.occurred_at)
                        });
                    }
                });
                this.setState({
                    items: [],
                    sensorReadings: []
                });
                this.setState({
                    isLoaded: true,
                    items: data.items,
                    sensorReadings: readings
                });
            }, (error) => {
                this.setState({
                    isLoaded: true,
                    error
                });
            });
    }

    forceWatering() {
        fetch(
            "/api/actions", {
                method: "POST"
            })
            .then(resp => resp.status)
            .then(status => this.setState({
                wateringForced: (status === 201)
            }));
    }

    render() {
        const {items, sensorReadings, wateringForced} = this.state;
        return (
            <div className="waschbaer">
                <div>
                    <table>
                        <tr>
                            <td className="coral">From: <DateTime onChange={this.applyChartStartTime} closeOnSelect
                                                                  viewMode="time"/></td>
                            <td className="coral">To:<DateTime onChange={this.applyChartEndTime} closeOnSelect
                                                               viewMode="time"/></td>
                            <td className="coral">
                                <button onClick={this.forceWatering}>Force watering</button>
                                <br/>
                                <span>Watering trigger: {Boolean(wateringForced).toString()}</span>
                            </td>
                        </tr>
                    </table>
                </div>
                <div>
                    <LineChart data={sensorReadings} width={1000} height={600}>
                        <CartesianGrid strokeDasharray="3 3"/>

                        <XAxis type="number" tickFormatter={tick => App.numberToDate(tick)} domain={['auto', 'auto']}
                               dataKey="occurred_at_numeric" xAxisId={0}/>

                        <YAxis dataKey="y" yAxisId={1}/>

                        {
                            items.map(item => {
                                if (item.type === 'ACTION') {
                                    return <ReferenceLine x={App.dateToNumber(item.occurred_at)}
                                                          label={item.data.event_data.action_name}
                                                          xAxisId={0} yAxisId={1} stroke="green"/>
                                }
                            })
                        }

                        <Legend verticalAlign="top" height={36}/>

                        <ReferenceLine y={10} label="Watering threshold" stroke="red" strokeDasharray="3 3" xAxisId={0}
                                       yAxisId={1}/>

                        <Line name="MoistureSensor-A0" type="monotone" dataKey="MoistureSensor-A0" stroke="#81C784"
                              xAxisId={0} yAxisId={1}/>
                        <Line name="MoistureSensor-A1" type="monotone" dataKey="MoistureSensor-A1" stroke="#FF9800"
                              xAxisId={0} yAxisId={1}/>
                        <Line name="MoistureSensor-A2" type="monotone" dataKey="MoistureSensor-A2" stroke="#90A4AE"
                              xAxisId={0} yAxisId={1}/>
                        <Line name="MoistureSensor-A3" type="monotone" dataKey="MoistureSensor-A3" stroke="#BA68C8"
                              xAxisId={0} yAxisId={1}/>
                        <Line name="MoistureSensor-Average" type="monotone" dataKey="avg" stroke="#1A237E"
                              strokeWidth="2"
                              xAxisId={0} yAxisId={1}/>

                    </LineChart>
                </div>
            </div>
        );
    }

}
