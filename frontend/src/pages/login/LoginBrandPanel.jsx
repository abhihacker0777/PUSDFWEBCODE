import logo from "../../assets/pulogo.png";

export default function LoginBrandPanel() {
  return (
    <div className="w-full md:w-72 flex flex-col justify-between py-10 px-6 md:px-10" style={{ backgroundColor: "#264796" }}>
      <h1 className="text-2xl md:text-4xl font-extrabold leading-snug text-center md:text-left">
        <span className="text-white">Create, Update,<br />Manage<br /></span>
        <span style={{ color: "#e31d23" }}>&amp; Upload Your<br /></span>
        <span className="text-white">PYQP</span>
      </h1>
      <div className="flex flex-col items-center mt-6 md:mt-0">
        <img src={logo} alt="Poornima University Logo" className="w-52 h-auto object-contain" />
      </div>
      <div />
    </div>
  );
}
