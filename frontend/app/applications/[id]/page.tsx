import NavBarComponent from "@/src/components/navBarComponent";

import SolicitudDetailView from "@/src/views/applications/solicitudDetailView";
import SolicitudDetailViewCreator from "@/src/views/applications/solicitudDetailViewCreator";

const IS_OWNER = true;

const SolicitudDetailPage = () => {
  return (
    <>
      <NavBarComponent />

      {IS_OWNER ? <SolicitudDetailViewCreator /> : <SolicitudDetailView />}
    </>
  );
};

export default SolicitudDetailPage;
