import Link from "next/link";

export default function NotFound() {
  return (
    <div className="intro">
      <h1>Термин не найден</h1>
      <p>
        <Link href="/">Вернуться на главную</Link>
      </p>
    </div>
  );
}
