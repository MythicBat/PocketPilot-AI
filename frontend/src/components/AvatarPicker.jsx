const avatars = [
  { id: "friendly", emoji: "🙂", label: "Friendly" },
  { id: "student", emoji: "🎒", label: "Student" },
  { id: "explorer", emoji: "🚀", label: "Explorer" },
  { id: "thinker", emoji: "🧠", label: "Thinker" },
  { id: "calm", emoji: "🌿", label: "Calm" },
  { id: "professional", emoji: "💼", label: "Professional" },
  { id: "traveller", emoji: "🌍", label: "Traveller" },
  { id: "cozy", emoji: "🐱", label: "Cozy" },
];

export default function AvatarPicker({ selected, onSelect }) {
  return (
    <div className="avatar-grid">
      {avatars.map((avatar) => (
        <button
          key={avatar.id}
          type="button"
          className={`avatar-option ${
            selected === avatar.id ? "selected" : ""
          }`}
          onClick={() => onSelect(avatar.id)}
        >
          <span>{avatar.emoji}</span>
          <small>{avatar.label}</small>
        </button>
      ))}
    </div>
  );
}