// src/_tests_/context/SocketContext.test.js
import React from 'react';
import { render, screen } from '@testing-library/react';
import { SocketProvider, useSocket } from '../../context/SocketContext';
import { io } from 'socket.io-client';

jest.mock('socket.io-client');

const Consumer = () => {
  const { socket, isConnected } = useSocket();
  return (
    <div>
      <span>Connected: {socket && isConnected ? 'yes' : 'no'}</span>
      <span>Socket ID: {socket?.id ?? 'none'}</span>
    </div>
  );
};

describe('SocketContext', () => {
  it('provides socket=null when no token', () => {
    jest.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);
    io.mockImplementation(() => ({ on: () => {}, disconnect: () => {} }));

    render(
      <SocketProvider>
        <Consumer />
      </SocketProvider>
    );

    expect(screen.getByText(/Connected: no/)).toBeInTheDocument();
    expect(screen.getByText(/Socket ID: none/)).toBeInTheDocument();
  });

  it('connects socket when token is present', () => {
    jest.spyOn(Storage.prototype, 'getItem').mockReturnValue('fake-token');
    const fakeSocket = { id: 'socket123', on: jest.fn(), disconnect: jest.fn(), connected: false };
    io.mockReturnValue(fakeSocket);

    render(
      <SocketProvider>
        <Consumer />
      </SocketProvider>
    );

    // after mount effect
    expect(screen.getByText(/Socket ID: socket123/)).toBeInTheDocument();
  });
});
