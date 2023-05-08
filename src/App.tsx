import React, { useState } from 'react';
import { EventSourcePolyfill } from 'event-source-polyfill';

interface SseTestProps {}

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

    const handleLogin = async () => {
      const loginEndpoint = 'http://localhost:8080/login';
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
        const sseURL = 'http://localhost:8080/auth/connect';

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
              const response = await fetch('http://localhost:8080/auth/disconnect', {
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
            const response = await fetch('http://localhost:8080/auth/msg', {
                method: 'GET',
                headers: {
                    'Authorization': accessToken
                }
            });

            if (response.status === 200) {
                //console.log('msg request success');
            } else {
              console.error('Failed to get the message');
              setMessage('Failed to get the message');
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
                  <p key={index} style={{ fontSize: '24px' }}>ID: {alarm.id}, Content: {alarm.content}</p>
              ))}
              <p style={{ fontSize: '24px' }}>{message}</p>
          </div>
      </div>
    );
};

export default App;
