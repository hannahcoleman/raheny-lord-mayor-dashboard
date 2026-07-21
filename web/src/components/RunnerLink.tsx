import { Link } from "react-router-dom";

export default function RunnerLink({ name }: { name: string }) {
  return <Link to={`/runner/${encodeURIComponent(name)}`}>{name}</Link>;
}
