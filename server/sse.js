const clients = new Map();

export function addClient(eventId, res) {
  if (!clients.has(eventId)) {
    clients.set(eventId, new Set());
  }
  clients.get(eventId).add(res);

  res.on('close', () => {
    const set = clients.get(eventId);
    if (set) {
      set.delete(res);
      if (set.size === 0) clients.delete(eventId);
    }
  });
}

export function broadcast(eventId, data) {
  const set = clients.get(eventId);
  if (!set) return;
  const msg = `data: ${JSON.stringify(data)}\n\n`;
  for (const res of set) {
    res.write(msg);
  }
}
