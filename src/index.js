import React, {useEffect, useRef} from 'react';
import {createRoot} from 'react-dom/client';
import {Stage, Layer, Line} from 'react-konva';
import io from 'socket.io-client';

const App = () => {
    const [tool, setTool] = React.useState('pen');
    const [lines, setLines] = React.useState([]);
    const isDrawing = useRef(false);
    const socket = useRef(null);
    const roomIdInput = useRef(null);

    useEffect(() => {
        socket.current = io('http://localhost:3001');

        socket.current.on('initBoard', (initialLines) => {
            console.log("Приймаю дошку довжини " + initialLines.length)
            setLines(initialLines);
        });

        socket.current.on('draw', (data, index) => {
            console.log("Прийняв дошку довжини " + data.length)
            setLines(data);
        });

        return () => {
            socket.current.disconnect();
        };
    }, []);
    const handleMouseDown = (e) => {
        isDrawing.current = true;
        const pos = e.target.getStage().getPointerPosition();
        const newLine = [pos.x, pos.y];
        lines.push(newLine)
        if(roomIdInput.current.value) socket.current.emit('draw', lines, roomIdInput.current.value);
    };

    const handleMouseMove = (e) => {
        // no drawing - skipping
        if (!isDrawing.current) {
            return;
        }

        const stage = e.target.getStage();
        const point = stage.getPointerPosition();
        let lastLine = lines[lines.length - 1];
        lastLine = lastLine.concat([point.x, point.y]);

        // replace last
        lines.splice(lines.length - 1, 1, lastLine);
        setLines(lines.concat());
        if(roomIdInput.current.value) socket.current.emit('draw', lines, roomIdInput.current.value);
    };

    const handleMouseUp = () => {
        isDrawing.current = false;
    };

    const handleJoinRoom = () => {
        const roomId = roomIdInput.current.value;
        socket.current.emit('joinRoom', roomId);
    };

    return (
        <div>
            <select
                value={tool}
                onChange={(e) => {
                    setTool(e.target.value);
                }}
            >
                <option value="pen">Ручка</option>
                <option value="eraser">Затирачка</option>
            </select>
            <input type="text" placeholder="Enter room ID" ref={roomIdInput}/>
            <button onClick={handleJoinRoom}>Join Room</button>
            <Stage
                height="500"
                width={window.innerWidth}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                style={{border: '1px solid black'}}
            >
                <Layer>
                    {lines.map((line, i) => (
                        <Line
                            key={i}
                            points={line}
                            stroke="#df4b26"
                            strokeWidth={5}
                            tension={0.5}
                            lineCap="round"
                            lineJoin="round"
                            globalCompositeOperation={'source-over'}
                        />
                    ))}
                </Layer>
            </Stage>
        </div>
    );
};

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App/>);
