import React, { useState } from 'react';
import { EventSourcePolyfill } from 'event-source-polyfill';

interface SseTestProps {}
<div></div>
interface AlarmOutDTO {
  id: number;
  content: string;
}

const App: React.FC<SseTestProps> = () => {
  
  const [eventSource, setEventSource] = useState<EventSourcePolyfill | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [alarms, setAlarms] = useState<AlarmOutDTO[]>([]);

  const [message, setMessage] = useState<string>('');
  const [email, setEmail] = useState<string>('ssar@nate.com');
  const [password, setPassword] = useState<string>('1234');
  const [leaveType, setLeaveType] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

    const handleLogin = async () => {
      const loginEndpoint = 'http://localhost:10000/login';
      const loginData = {
          email: email,
          password: password
      };

        try {
            const response = await fetch(loginEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(loginData)
            });

            if (response.status === 200) {
              const accessToken = response.headers.get('Authorization');
              const refreshToken = response.headers.get('RefreshToken');

              if (!accessToken || !refreshToken) {
                throw new Error('Token not found in headers');
              }

              setAccessToken(accessToken);
              setRefreshToken(refreshToken);

              connect(accessToken);
            } else {
                throw new Error('Login failed');
            }
        } catch (error) {
          const errorMessage = (error as Error).message;
          console.error('Error:', errorMessage);
          setMessage(`Error: ${errorMessage}`);
        }
    };

    const connect = (token: string) => {
        const sseURL = 'http://localhost:10000/auth/connect';

        // 이미 연결이 존재하는 경우 연결을 닫습니다.
        if (eventSource) {
          eventSource.close();
        }

        const newEventSource = new EventSourcePolyfill(sseURL, { headers: { 'Authorization': token } });

        newEventSource.onmessage = () => {
          const msg = `received from ${sseURL}`;
            //console.log(msg);
            setMessage(msg);
        };

        newEventSource.addEventListener("connect", event => {
          const messageEvent = event as MessageEvent;
          const msg = `EventType : ${event.type}, Data: ${messageEvent.data}`;
            //console.log(msg);
            setMessage(msg);
        });

        newEventSource.addEventListener("alarm", event => {
          const messageEvent = event as MessageEvent;
          const receivedAlarm: AlarmOutDTO = JSON.parse(messageEvent.data);
          const msg = `EventType : ${event.type}, Data: ${JSON.stringify(receivedAlarm)}`;
          //console.log(msg);
          setMessage(msg);
        });

        setEventSource(newEventSource);
    };

    const handleDisconnect = async () => {
      if (eventSource && accessToken) {
          try {
              const response = await fetch('http://localhost:10000/auth/disconnect', {
                  method: 'POST',
                  headers: {
                      'Authorization': accessToken
                  }
              });
  
              if (response.status === 200) {
                  //console.log('Disconnected successfully');
                  setMessage('Disconnected successfully');
                  eventSource.close();
                  setEventSource(null);
              } else {
                  //console.error('Failed to disconnect');
                  setMessage('Failed to disconnect');
              }
          } catch (error) {
            const errorMessage = (error as Error).message;
            console.error('Error:', errorMessage);
            setMessage(`Error: ${errorMessage}`);
          }
      }
    };

    const handleMessage = async () => {
      if (accessToken) {
        const response = await fetch('http://localhost:10000/auth/msg', {
          method: 'GET',
          headers: {
            'Authorization': accessToken
          }
        });
    
        if (response.status === 200) {
          const alarmOutDTO: AlarmOutDTO = await response.json();
          setAlarms([...alarms, alarmOutDTO]);
        } else {
          console.error('Failed to get the message');
          setMessage('Failed to get the message');
        }
      }
    };

    const handleLeaveApply = async () => {
      if (accessToken) {
        const leaveApplyEndpoint = 'http://localhost:10000/auth/leave/apply';
        const leaveApplyData = {
          type: leaveType,
          startDate: startDate,
          endDate: endDate,
        };
    
        try {
          const response = await fetch(leaveApplyEndpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': accessToken,
            },
            body: JSON.stringify(leaveApplyData),
          });
    
          if (response.status === 200) {
            console.log('Leave applied successfully');
          } else {
            throw new Error('Leave application failed');
          }
        } catch (error) {
          const errorMessage = (error as Error).message;
          console.error('Error:', errorMessage);
          setMessage(`Error: ${errorMessage}`);
        }
      }
    };

    return (
      <div>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button onClick={handleLogin}>Login</button>
          <button onClick={handleDisconnect} disabled={!eventSource}>Disconnect</button>
          <button onClick={handleMessage} disabled={!accessToken}>Message</button>
          <div>
            {alarms.map((alarm, index) => (
              <pre key={index} style={{ fontSize: '24px' }}>
                {JSON.stringify(alarm, null, 2)}
              </pre>
            ))}
            <p style={{ fontSize: '24px' }}>{message}</p>
          </div>

          <div>
          <select value={leaveType} onChange={(e) => setLeaveType(e.target.value)}>
            <option value="" disabled>Select Leave Type</option>
            <option value="ANNUAL">Annual</option>
            <option value="DUTY">Duty</option>
          </select>

          <input
            type="date"
            placeholder="Start Date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <input
            type="date"
            placeholder="End Date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
          <button onClick={handleLeaveApply} disabled={!accessToken}>Apply Leave</button>
          </div>

      </div>
      
    );

    
};

export default App;
