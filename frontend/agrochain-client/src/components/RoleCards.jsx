import "../assets/css/home.css";

export default function RoleCards() {
  const roles = [
    {
      title: "Farmers",
      icon: "fa-tractor",
      subtitle: "Primary Producers",
      img: "https://media.istockphoto.com/photos/farmer-in-field-picture-id958375244?k=6&m=958375244&s=170667a&w=0&h=tWi266M_Ki2dsWk5IEGHAhrzXOLmsa45Oq6FuTJV3UY=",
      description:
        "List agricultural products, manage inventory, and track sales through personalized dashboards. Respond to orders and set product prices.",
      link: "/login",
    },
    {
      title: "Dealers",
      icon: "fa-warehouse",
      subtitle: "Intermediary Buyers",
      img: "https://irp.cdn-website.com/6569b6f0/dms3rep/multi/CPT_1184-18741928.JPG",
      description:
        "Purchase in bulk from farmers and handle transportation. Browse products, place bulk orders, and manage distribution efficiently.",
      link: "/login",
    },
    {
      title: "Retailers",
      icon: "fa-store",
      subtitle: "End-Point Businesses",
      img: "https://tse3.mm.bing.net/th/id/OIP.fF2-JVup5DRVfufabXOUjAAAAA?cb=12&rs=1&pid=ImgDetMain&o=7&rm=3",
      description:
        "Purchase from dealers for consumer sales. Manage inventory, place orders, and track deliveries via an integrated system.",
      link: "/login",
    },
  ];

  return (
    <section id="roles" className="roles-section">
      <div className="container">
        <div className="section-header">
          <h2>Users & Their Roles</h2>
          <div className="section-underline"></div>
          <p className="section-description">
            Empowering the key stakeholders in the agricultural supply chain: Farmers, Dealers, and Retailers.
          </p>
        </div>

        <div className="roles-grid roles-grid-three">
          {roles.map((role, index) => (
            <div className="role-card" key={index}>
              <div className="role-image">
                <img src={role.img} alt={role.title} />
              </div>
              <div className="role-content">
                <div className="role-icon">
                  <i className={`fas ${role.icon}`}></i>
                </div>
                <h3>{role.title}</h3>
                <p className="role-subtitle">{role.subtitle}</p>
                <p className="role-description">{role.description}</p>
                <a href={role.link}><button className="role-btn">Register as {role.title}</button></a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
