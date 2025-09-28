export function MenuList({ menus }: { menus: string[] }) {
  return (
    <ul className="space-y-2">
      {menus.map((m) => (
        <li key={m} className="p-3 rounded-lg border">{m}</li>
      ))}
    </ul>
  );
}
